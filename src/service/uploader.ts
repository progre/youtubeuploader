import * as fs from 'fs';
import {EventEmitter} from 'events';
import * as log4js from 'log4js';
import * as lockFile from 'lockfile';
let bluebird = require('bluebird');
let trash = require('trash');
let BrowserWindow = require('browser-window');
let youtubeAPI = require('youtube-api');
let googleOAuth = require('electron-google-oauth')(BrowserWindow);
import Repository from './repository';
import {Config} from './interfaces';

let secret = {
    clientId:
    'ISAMIDY+AXwiMxpjODcFMHEyLycgJkEXI0M3LiMxJjtoGyQ3ZwpZIS5YRi8xBjo8IjclLzYGUjoyRiUjOlgkJygrahcwHBI8NzUwIiI1ICYgMGAwJRYUIDUNDUI1AkAE',
    clientSecret: 'IAIlEiA5RU80OQVRJxsSE2MfFhEqOxk2LxgCOjEUWF4='
};

interface AccessToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

secret.clientId = sutalize(secret.clientId);
secret.clientSecret = sutalize(secret.clientSecret);

export default class Uploader extends EventEmitter {
    private list: string[] = [];
    private working = false;
    private authenticateShown = false;

    constructor(private repository: Repository) {
        super();
    }

    authenticate() {
        if (this.authenticateShown) {
            return;
        }
        this.authenticateShown = true;
        return <Promise<{}>>googleOAuth.getAccessToken(
            ['https://www.googleapis.com/auth/youtube.upload'],
            secret.clientId,
            secret.clientSecret)
            .catch((e: Error) => {
                this.authenticateShown = false;
                throw e;
            })
            .then((accessToken: AccessToken) => {
                this.authenticateShown = false;
                youtubeAPI.authenticate({
                    type: 'oauth',
                    token: accessToken.access_token
                });
                this.beginUpload();
            });
    }

    queue(filePath: string) {
        if (this.list.indexOf(filePath) < 0) {
            this.list.push(filePath);
        }
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
        let check = bluebird.promisify(lockFile.check);
        let stat = bluebird.promisify(fs.stat);
        return Promise.all<any>([
            check(filePath)
                .then(() => stat(filePath)),
            this.repository.load()
        ])
            .then(obj => {
                let stats: fs.Stats = obj[0];
                let config: Config = obj[1];
                let t = title(config.name, stats);
                super.emit('start', filePath);
                return Promise.all([
                    upload(filePath, config, stats),
                    Promise.resolve(t)
                ]);
            })
            .then((obj: any[]) => {
                super.emit('complete', obj[1]);
                log4js.getLogger().info('upload succeeded: ' + filePath);
                let trashPromise = bluebird.promisify(trash);
                return trashPromise([filePath]);
            })
            .then(() => {
                log4js.getLogger().info('move to trash box: ' + filePath);
            })
            .catch(e => {
                log4js.getLogger().error('upload failed: ' + filePath);
                return Promise.reject(e);
            });
    }
}

function upload(filePath: string, config: Config, stats: fs.Stats) {
    let insert = bluebird.promisify(youtubeAPI.videos.insert);
    return insert({ part: 'snippet' })
        .catch((err: any) => {
            if (err.code === 401) {
                throw err;
            }
        })
        .then(() => insert({
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
        }));
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

function sutalize(src: string) {
    let srcBuffer = new Buffer(src, 'base64');
    let dst = '';
    let sutachu = 'sutachu-san maji sutasuta';
    for (let i = 0; i < srcBuffer.length; i++) {
        dst += String.fromCharCode(srcBuffer.readInt8(i) ^ sutachu.charCodeAt(i % sutachu.length));
    }
    return dst;
}

secret.clientId = sutalize(secret.clientId);
secret.clientSecret = sutalize(secret.clientSecret);
