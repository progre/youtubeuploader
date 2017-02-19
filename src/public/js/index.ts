declare let require: any;
let erequire = require;
let ipc = erequire('electron').ipcRenderer;
import {Config} from '../../service/interfaces';

ipc.on('data', (data: Config) => {
    $('#channelName').val(data.name).removeAttr('disabled');
    $('#watchPath').val(data.watchPath).removeAttr('disabled');
    $('#tags').val(data.tags).removeAttr('disabled');
});
ipc.send('load');

window.addEventListener('unload', () => {
    let data: Config = {
        name: $('#channelName').val(),
        watchPath: $('#watchPath').val(),
        tags: $('#tags').val()
    };
    ipc.send('save', data);
});

$('#watchPath')[0].addEventListener('drop', (e: any) => {
    let file = e.dataTransfer.files[0];
    $('#watchPath').val(file.path);
});

window.addEventListener('dragover', e => {
    e.preventDefault();
});

window.addEventListener('drop', e => {
    e.preventDefault();
});
