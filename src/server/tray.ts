import Uploader from './uploader';
import * as path from 'path';
let Tray = require('tray');
let Menu = require('menu');
let BrowserWindow = require('browser-window');

export function create(app: any, uploader: Uploader) {
    let tray = createTray();
    let contextMenu = Menu.buildFromTemplate([
        {
            label: 'Option', click: () => {
                let window = new BrowserWindow({
                    width: 800,
                    height: 300,
                    resizable: false,
                    'skip-taskbar': true,
                    show: true
                });
                window.setMenu(null);
                window.loadUrl(path.normalize(`file://${__dirname}/../public/index.html`));
            }
        },
        {
            label: 'Authenticate', click: () => {
                uploader.authenticate();
            }
        },
        {
            label: 'Exit', click: () => {
                app.quit();
            }
        }]);
    tray.setToolTip('YouTube Auto Uploader');
    tray.setContextMenu(contextMenu);
    return tray;
}

function createTray() {
    let resourcePath = path.normalize(__dirname + '/../res');
    if (process.platform === 'darwin') {
        let tray = new Tray(resourcePath + '/YouTube-social-icon_dark_16px@2x.png');
        tray.setPressedImage(resourcePath + '/YouTube-social-icon_light_16px@2x.png');
        return tray;
    } else {
        return new Tray(resourcePath + '/YouTube-social-squircle_red_128px.png');
    }
}
