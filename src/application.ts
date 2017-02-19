import { v4 as uuid } from 'node-uuid';
let app = require('electron').app;
let BrowserWindow = require('electron').BrowserWindow;
import { ipcMain as ipc } from 'electron';
import Uploader from './service/uploader';
import Repository from './service/repository';
import { Config } from './service/interfaces';
import AppTray from './ui/apptray';
import Watcher from './ui/watcher';
import Notifier from './ui/notifier';

export default class Application {
    private repos = new Repository(app.getPath('userData') + '/config.json');
    private uploader = new Uploader(this.repos);
    private watcher = new Watcher(this.uploader);
    private notifier = new Notifier(this.uploader);
    private hiddenWindow: any;
    private appTray: AppTray;

    constructor() {
        ipc.on('load', event => {
            this.repos.load().then(config => {
                event.sender.send('data', config);
            });
        });
        ipc.on('save', (event: any, data: Config) => {
            this.repos.save(data);
            this.watcher.watch(data.watchPath);
        });
        this.notifier;
    }

    static new() {
        app.setName(app.getName() + '{' + uuid() + '}');
        switch (process.platform) {
            case 'darwin':
                app.dock.hide();
                break;
            default:
                break;
        }
        let thiz = new Application();
        return Promise.all<{}>([
            thiz.repos.load()
                .then(config => thiz.watcher.watch(config.watchPath)),
            new Promise((resolve, reject) => app.on('ready', resolve))
                .then(() => thiz.initUI())
        ]).then(() => thiz);
    }

    private initUI() {
        this.hiddenWindow = new BrowserWindow({ width: 0, height: 0, show: false });
        this.appTray = new AppTray(this.uploader);
    }
}
