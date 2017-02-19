import * as fs from 'fs';
let bluebird = require('bluebird');
import * as log4js from 'log4js';
import * as chokidar from 'chokidar';
import Uploader from '../service/uploader';

export default class Watcher {
    private path: string;
    private fsWatcher: any;

    constructor(private uploader: Uploader) {
    }

    watch(path: string) {
        path += '/*.*(flv|mkv|mov|mp4|ts)';
        if (path === this.path) {
            return;
        }
        this.path = path;
        if (this.fsWatcher != null) {
            this.fsWatcher.close();
        }
        this.fsWatcher = chokidar.watch(path)
            .on("add", path => {
                if (process.platform !== 'win32') {
                    return;
                }
                log4js.getLogger().info('File added: ' + path);
                this.uploader.queue(path);
            })
            .on('change', (path: string) => {
                if (process.platform === 'win32') {
                    return;
                }
                if (process.platform === 'darwin') {
                    const stat = bluebird.promisify(fs.stat);
                    let size: number;
                    stat(path)
                        .then((stats: fs.Stats) => {
                            size = stats.size;
                            return bluebird.delay(10 * 1000);
                        })
                        .then(() => stat(path))
                        .then((stats: fs.Stats) => {
                            if (size !== stats.size) {
                                return;
                            }
                            log4js.getLogger().info('File changed: ' + path);
                            this.uploader.queue(path);
                        });
                    return;
                }
                log4js.getLogger().info('File changed: ' + path);
                this.uploader.queue(path);
            });
        log4js.getLogger().info('Watch start: ' + path);
    }
}
