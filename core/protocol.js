var Protocol = require('protocol');
var Url = require('fire-url');
var Path = require('fire-path');

// register uuid:// protocol
// =======================================

Protocol.registerProtocol('uuid', function(request) {
    var url = decodeURIComponent(request.url);
    var uri = Url.parse(url);
    var file = _url2path(uri);
    return new Protocol.RequestFileJob(file);
}, Editor.protocolRegisterCallback);

function _url2path (urlInfo) {
    var root;
    var uuid = urlInfo.hostname;
    return Editor.assetdb.uuidToFspath(uuid);
}
Editor.registerProtocol('uuid', _url2path );

// register thumbnail:// protocol
// =======================================

Protocol.registerProtocol('thumbnail', function(request) {
    var url = decodeURIComponent(request.url);
    var uri = Url.parse(url);
    var file = _url2thumbnail(uri);
    return new Protocol.RequestFileJob(file);
}, Editor.protocolRegisterCallback);

function _url2thumbnail (urlInfo) {
    var root;
    var uuid = urlInfo.hostname;
    var dest = Editor.assetdb._uuidToImportPathNoExt(uuid);

    return dest + '.thumb.png';
}
Editor.registerProtocol('thumbnail', _url2thumbnail );
