import {EventEmitter} from 'events';
import * as chokidar from 'chokidar';

export default class Watcher extends EventEmitter {
    private path: string;
    private fsWatcher: any;

    watch(path: string) {
        if (path === this.path) {
            return;
        }
        this.path = path;
        if (this.fsWatcher != null) {
            this.fsWatcher.close();
        }
        this.fsWatcher = chokidar.watch(path)
            .on('change', (path: string) => this.emit('change', path));
    }
}
