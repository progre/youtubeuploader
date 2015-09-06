/// <reference path="./typings.d.ts" />
'use strict';
require('source-map-support').install();
import {sep} from 'path';
import * as chokidar from 'chokidar';
import * as log4js from 'log4js';
let app = require('app');
let BrowserWindow = require('browser-window');
import {create as createTray} from './tray';
import Uploader from './uploader';
import Repository from './repository';

require('crash-reporter').start();

// GCに回収させないもの
let hiddenWindow: any; // アプリケーション維持
let tray: any; // タスクトレイに常駐

let repos = new Repository(app.getPath('userData') + sep + 'config.json');
Promise.all([
    repos.load().then(config => {
        if (config.watchPath == null) {
            config.watchPath = 'E:\\Documents\\peercastlog\\';
            config.name = 'ぷろぐれch';
            config.tags = [config.name, 'PeerCast'];
        }
        return repos.save(config)
            .catch(reason => {
                console.error(reason);
                return null;
            })
            .then(() => config);
    }),
    new Promise((resolve, reject) => app.on('ready', resolve))
]).then(obj => {
    let config = obj[0];
    hiddenWindow = new BrowserWindow({ width: 0, height: 0, show: false });
    let uploader = new Uploader(repos);
    tray = createTray(app, uploader);

    uploader.on('uploadfailed', (e: any) => {
        if (e.code == null || e.code !== 401) {
            console.error(e);
            return;
        }
        tray.displayBalloon({
            title: 'YouTube Auto Uploader',
            content: '認証情報を入力してください',
            clicked: () => {
                uploader.authenticate();
            }
        });
        return;
    });
    chokidar.watch(config.watchPath)
        .on('change', (path: string) => {
            log4js.getLogger().info('File changed: ' + path);
            uploader.queue(path);
        });
});
