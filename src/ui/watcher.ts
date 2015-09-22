import * as log4js from 'log4js';
import * as chokidar from 'chokidar';
import Uploader from '../service/uploader';

export default class Watcher {
    private path: string;
    private fsWatcher: any;

    constructor(private uploader: Uploader) {
    }

    watch(path: string) {
        if (path === this.path) {
            return;
        }
        this.path = path;
        if (this.fsWatcher != null) {
            this.fsWatcher.close();
        }
        this.fsWatcher = chokidar.watch(path)
            .on('change', (path: string) => {
                log4js.getLogger().info('File changed: ' + path);
                this.uploader.queue(path);
            });
    }
}
