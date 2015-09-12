import Uploader from './uploader';
let Tray = require('tray');
let Menu = require('menu');

export function create(app: any, uploader: Uploader) {
    let tray = createTray();
    let contextMenu = Menu.buildFromTemplate([
        {
            label: 'authenticate', click: () => {
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
    if (process.platform === 'darwin') {
        let tray = new Tray(__dirname + '/res/YouTube-social-icon_dark_16px@2x.png');
        tray.setPressedImage(__dirname + '/res/YouTube-social-icon_light_16px@2x.png');
        return tray;
    } else {
        return new Tray(__dirname + '/res/YouTube-social-squircle_red_128px.png');
    }
}
