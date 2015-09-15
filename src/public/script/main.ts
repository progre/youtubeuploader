/// <reference path="../../../typings/DefinitelyTyped/jquery/jquery.d.ts" />
declare let require: any;
let erequire = require;
let ipc = erequire('ipc');
import {Config} from '../../server/interfaces';

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
