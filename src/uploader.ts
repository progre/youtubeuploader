import * as fs from 'fs';
import {EventEmitter} from 'events';
import * as log4js from 'log4js';
import * as lockFile from 'lockfile';
let trash = require('trash');
let BrowserWindow = require('browser-window');
let youtubeAPI = require('youtube-api');
let googleOAuth = require('electron-google-oauth')(BrowserWindow);
let secret = require('./secret.json');
import Repository from './repository';
import {Config} from './interfaces';

interface AccessToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

export default class Uploader extends EventEmitter {
    private list: string[] = [];
    private working = false;

    constructor(private repository: Repository) {
        super();
    }

    authenticate() {
        return <Promise<{}>>googleOAuth.getAccessToken(
            ['https://www.googleapis.com/auth/youtube.upload'],
            secret.clientId,
            secret.clientSecret)
            .then((accessToken: AccessToken) => {
                youtubeAPI.authenticate({
                    type: 'oauth',
                    token: accessToken.access_token
                });
                this.beginUpload();
            });
    }

    queue(filePath: string) {
        this.list.push(filePath);
        this.beginUpload();
    }

    private beginUpload() {
        if (this.working) {
            return;
        }
        if (this.list.length === 0) {
            return;
        }
        this.working = true;
        this.uploadRecursive()
            .catch(e => {
                super.emit('failed', e);
            })
            .then(() => {
                log4js.getLogger().info('stop upload task');
                this.working = false;
            });
    }

    private uploadRecursive(): Promise<void> {
        if (this.list.length === 0) {
            return Promise.resolve();
        }
        return this.upload(this.list[0])
            .then(() => {
                this.list.shift();
                return this.uploadRecursive();
            });
    }

    private upload(filePath: string) {
        log4js.getLogger().info('start uploading: ' + filePath);
        return Promise.all<any>([
            new Promise<fs.Stats>((resolve, reject) => {
                lockFile.check(filePath, (err, isLocked) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    fs.stat(filePath, (err1, stats) => {
                        if (err1 != null) {
                            reject(err1);
                            return;
                        }
                        resolve(stats);
                    });
                });
            }),
            this.repository.load()
        ]).then(obj => {
            let config: Config = obj[1];
            let stats: fs.Stats = obj[0];
            let t = title(config.name, stats);
            super.emit('start', t);
            return Promise.all([upload(filePath, config, stats), Promise.resolve(t)]);
        }).then((obj: any[]) => new Promise((resolve, reject) => {
            super.emit('complete', obj[1]);
            log4js.getLogger().error('upload succeeded: ' + filePath);
            trash([filePath], (err: any) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                log4js.getLogger().error('move to trash box: ' + filePath);
                resolve();
            });
        })).catch(e => {
            log4js.getLogger().error('upload failed: ' + filePath);
            return Promise.reject(e);
        });
    }
}

function upload(filePath: string, config: Config, stats: fs.Stats) {
    return new Promise<any>((resolve, reject) => {
        youtubeAPI.videos.insert(
            {
                part: 'snippet,status',
                resource: {
                    snippet: {
                        title: title(config.name, stats),
                        description: description(stats),
                        tags: config.tags
                    },
                    status: {
                        privacyStatus: 'private'
                    }
                },
                media: {
                    body: fs.createReadStream(filePath)
                }
            },
            (err: any, data: any) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
    });
}

function title(name: string, stats: fs.Stats) {
    return `${name} ${toString(stats.birthtime) }`;
}

function description(stats: fs.Stats) {
    return `配信開始: ${toString(stats.birthtime) }` + '\n'
        + `配信終了: ${toString(stats.mtime) }`;
}

function toString(date: Date) {
    return `${date.getFullYear() }年`
        + `${doubleDigits(date.getMonth() + 1) }月${doubleDigits(date.getDate()) }日 `
        + `${doubleDigits(date.getHours()) }時${doubleDigits(date.getMinutes()) }分`;
}

function doubleDigits(num: number) {
    return ('0' + num).slice(-2);
}
