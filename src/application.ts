import * as log4js from 'log4js';
import {v4 as uuid} from 'node-uuid';
let app = require('app');
let BrowserWindow = require('browser-window');
let ipc = require('ipc');
import Uploader from './service/uploader';
import Repository from './service/repository';
import {Config} from './service/interfaces';
import AppTray from './ui/apptray';
import Watcher from './ui/watcher';

export default class Application {
    private watcher = new Watcher();
    private repos = new Repository(app.getPath('userData') + '/config.json');
    private uploader: Uploader;
    private hiddenWindow: any;

    constructor() {
        this.uploader = new Uploader(this.repos); // TODO: 定義順でなんとかなるならインラインでやればええやん
        this.watcher.on('change', (path: string) => {
            log4js.getLogger().info('File changed: ' + path);
            this.uploader.queue(path);
        });
    }

    static new() {
        let thiz = new Application();
        app.setName(app.getName() + '{' + uuid() + '}');
        switch (process.platform) {
            case 'darwin':
                app.dock.hide();
                break;
            default:
                break;
        }

        return Promise.all([
            thiz.repos.load(),
            new Promise((resolve, reject) => app.on('ready', resolve))
        ]).then(obj => {
            let config = obj[0];
            thiz.hiddenWindow = new BrowserWindow({ width: 0, height: 0, show: false });
            ipc.on('load', (event: any) => {
                thiz.repos.load().then(config => {
                    event.sender.send('data', config);
                });
            });
            ipc.on('save', (event: any, data: Config) => {
                thiz.repos.save(data);
                thiz.watcher.watch(data.watchPath);
            });
            let appTray = new AppTray(app, thiz.uploader);

            thiz.uploader.on('start', (title: string) => {
                appTray.tray.displayBalloon({
                    title: 'YouTube Auto Uploader',
                    content: 'アップロードを開始しました: ' + title
                });
            });
            thiz.uploader.on('failed', (e: any) => {
                if (e.code == null || e.code !== 401) {
                    console.error(e);
                    return;
                }
                appTray.tray.displayBalloon({
                    title: 'YouTube Auto Uploader',
                    content: '認証情報を入力してください',
                    clicked: () => {
                        thiz.uploader.authenticate();
                    }
                });
            });
            thiz.uploader.on('complete', (title: string) => {
                appTray.tray.displayBalloon({
                    title: 'YouTube Auto Uploader',
                    content: 'アップロードが完了しました: ' + title
                });
            });
            thiz.watcher.watch(config.watchPath);
            return thiz;
        });
    }
}
