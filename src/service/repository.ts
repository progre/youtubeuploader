import * as fs from 'fs';
import {Config} from './interfaces';

export default class Repository {
    constructor(private configPath: string) {
    }

    load() {
        return new Promise<Config>((resolve, reject) => {
            fs.readFile(this.configPath, 'utf8', (err, data) => {
                if (err != null) {
                    resolve(<any>{});
                    return;
                }
                let json: Config;
                try {
                    json = JSON.parse(data);
                } catch (e) {
                    json = <any>{};
                }
                resolve(json);
            });
        });
    }

    save(data: Config) {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.configPath, JSON.stringify(data), err => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}
