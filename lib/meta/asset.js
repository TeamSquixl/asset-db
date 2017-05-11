var Fs = require('fire-fs');

function AssetMeta () {
    this.ver = 0;
    this.uuid = '';
    this['asset-type'] = this.constructor['asset-type'];
}
AssetMeta['asset-type'] = 'asset';

AssetMeta.prototype.serialize = function () {
    return this;
};

AssetMeta.prototype.deserialize = function ( jsonObj ) {
    this.ver = jsonObj.ver;
    this.uuid = jsonObj.uuid;
};

AssetMeta.prototype.import = null;

AssetMeta.prototype.export = function (path, data, cb) {
    if (data) {
        Fs.writeFile(path, data, cb);
        return;
    }

    if ( cb ) cb ();
};

AssetMeta.prototype.validate = null;

AssetMeta.prototype.useRawfile = function () {
    return true;
};

AssetMeta.prototype.dests = function ( assetdb ) {
    return [];
};

module.exports = AssetMeta;

