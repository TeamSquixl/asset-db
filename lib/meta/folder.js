var Fs = require('fire-fs');
var JS = require('../js-utils');
var $super = require('./asset');

function FolderMeta () {
    $super.call(this);
}
JS.extend(FolderMeta,$super);
FolderMeta['asset-type'] = 'folder';

FolderMeta.prototype.import = null;
FolderMeta.prototype.export = function (path, data, cb) {
    Fs.mkdirSync(path);
    if ( cb ) cb ();
};

module.exports = FolderMeta;

