import Uploader from '../service/uploader';
import * as path from 'path';
let app = require('electron').app;
let Tray = require('electron').Tray;
let Menu = require('electron').Menu;
let BrowserWindow = require('electron').BrowserWindow;

export default class AppTray {
    private optionWindow: any;
    tray = createTray();

    constructor(private uploader: Uploader) {
        this.tray.setContextMenu(this.createContextMenu(null));
        uploader.on('start', (fileName: string) => {
            this.tray.setContextMenu(this.createContextMenu(fileName));
        });

        uploader.on('failed', (e: any) => {
            this.tray.setContextMenu(this.createContextMenu(null));
        });

        uploader.on('complete', (title: string) => {
            this.tray.setContextMenu(this.createContextMenu(null));
        });
    }

    private createContextMenu(uploadingFileName: string | null) {
        let items: any[] = [];
        if (uploadingFileName != null) {
            items = items.concat(
                {
                    label: '録画ファイルをアップロード中...',
                    sublabel: uploadingFileName,
                    enabled: false
                },
                {
                    type: 'separator'
                });
        }
        items = items.concat(
            {
                label: 'Option', click: () => this.showOption()
            },
            {
                label: 'Authenticate', click: () => this.uploader.authenticate()
            },
            {
                label: 'Exit', click: () => app.quit()
            });
        return Menu.buildFromTemplate(items);
    }

    private showOption() {
        if (this.optionWindow != null) {
            this.optionWindow.focus();
            return;
        }
        this.optionWindow = new BrowserWindow({
            width: 800,
            height: 300,
            resizable: false,
            show: false,
            skipTaskbar: true,
            // menu: null
        });
        this.optionWindow.loadURL(path.normalize(`file://${__dirname}/../lib/public/index.html`)); // TODO: パス指定が雑
        this.optionWindow.on('closed', () => {
            this.optionWindow = null;
        });
        this.optionWindow.show();
    }
}

function createTray() {
    let resourcePath = path.normalize(__dirname + '/../lib/res'); // TODO: パス指定が雑
    let tray: any;
    if (process.platform === 'darwin') {
        tray = new Tray(resourcePath + '/YouTube-social-icon_dark_16px@2x.png');
        tray.setPressedImage(resourcePath + '/YouTube-social-icon_light_16px@2x.png');
    } else {
        tray = new Tray(resourcePath + '/YouTube-social-squircle_red_128px.png');
    }
    tray.setToolTip('YouTube Auto Uploader');
    return tray;
}
