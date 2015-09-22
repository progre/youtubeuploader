import {normalize} from 'path';
import * as notifier from 'node-notifier';
import Uploader from '../service/uploader';

export default class Notifier {
    constructor(private uploader: Uploader) {
        uploader.on('start', (title: string) => {
            notify('アップロードを開始しました: ' + title, false);
        });

        uploader.on('failed', (e: any) => {
            if (e.code == null || e.code !== 401) {
                notify(e.message, false);
                return;
            }
            notify('認証情報を入力してください', true)
                .on('click', () => {
                    uploader.authenticate();
                });
        });

        uploader.on('complete', (title: string) => {
            notify('アップロードが完了しました: ' + title, true);
        });
    }
}

function notify(message: string, wait: boolean) {
    return notifier.notify({
        title: 'YouTube Auto Uploader',
        message,
        icon: normalize(__dirname + '/../res/YouTube-social-squircle_red_128px.png'),
        wait
    });
}
