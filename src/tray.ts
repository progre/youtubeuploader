import Uploader from './uploader';
let Tray = require('tray');
let Menu = require('menu');

export function create(app: any, uploader: Uploader) {
    let tray = new Tray(__dirname + '/res/YouTube-social-squircle_red_128px.png');
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
