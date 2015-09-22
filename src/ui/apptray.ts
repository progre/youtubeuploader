import Uploader from '../service/uploader';
import * as path from 'path';
let app = require('app');
let Tray = require('tray');
let Menu = require('menu');
let BrowserWindow = require('browser-window');

export default class AppTray {
    private optionWindow: any;
    public tray = createTray();

    constructor(uploader: Uploader) {
        this.tray.setContextMenu(Menu.buildFromTemplate([
            {
                label: 'Option', click: () => this.showOption()
            },
            {
                label: 'Authenticate', click: () => uploader.authenticate()
            },
            {
                label: 'Exit', click: () => app.quit()
            }
        ]));
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
            'skip-taskbar': true,
            menu: null
        });
        this.optionWindow.loadUrl(path.normalize(`file://${__dirname}/../public/index.html`));
        this.optionWindow.on('closed', () => {
            this.optionWindow = null;
        });
        this.optionWindow.show();
    }
}

function createTray() {
    let resourcePath = path.normalize(__dirname + '/../res');
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
