var Fs = require('fire-fs');
var Path = require('fire-path');
var Del = require('del');
var Async = require('async');
var Minimatch = require('minimatch');

var AssetDB = require('../index');
var Meta = require('../lib/meta');
var Static = require('../lib/static');
var JS = require('../lib/js-utils');

// ----------------
// init meta
// ----------------

var $super = Meta.AssetMeta;

// ImportAssetMeta
function ImportAssetMeta () {
    $super.call(this);
}
JS.extend(ImportAssetMeta,$super);
ImportAssetMeta['asset-type'] = 'import-asset';
ImportAssetMeta.prototype.useRawfile = function () {
    return false;
};
ImportAssetMeta.prototype.dest = function ( assetdb ) {
    return [
        assetdb._uuidToImportPathNoExt( this.uuid ) + '.asset',
    ];
};
ImportAssetMeta.prototype.import = function ( assetdb, fspath, cb ) {
    assetdb.copyAssetToLibrary( this.uuid, fspath );
    if ( cb ) cb ();
};
ImportAssetMeta.prototype.export = null;

// ParticleImageMeta
function ParticleImageMeta () {
    $super.call(this);
}
ParticleImageMeta.validate = function ( assetpath ) {
    return Minimatch( assetpath, '**/particles/*.png' );
};
JS.extend(ParticleImageMeta,$super);
ParticleImageMeta['asset-type'] = 'texture';
ParticleImageMeta.prototype.useRawfile = function () {
    return false;
};
ParticleImageMeta.prototype.dest = function ( assetdb ) {
    return [
        assetdb._uuidToImportPathNoExt( this.uuid ) + '.png',
    ];
};
ParticleImageMeta.prototype.import = function ( assetdb, fspath, cb ) {
    assetdb.copyAssetToLibrary( this.uuid, fspath );
    if ( cb ) cb ();
};

// ImageMeta
function ImageMeta () {
    $super.call(this);
}
JS.extend(ImageMeta,$super);
ImageMeta['asset-type'] = 'texture';
ImageMeta.prototype.useRawfile = function () {
    return false;
};
ImageMeta.prototype.dest = function ( assetdb ) {
    return [
        assetdb._uuidToImportPathNoExt( this.uuid ) + '.png',
    ];
};
ImageMeta.prototype.import = function ( assetdb, fspath, cb ) {
    assetdb.copyAssetToLibrary( this.uuid, fspath );
    if ( cb ) cb ();
};

// AtlasMeta
function AtlasMeta () {
    $super.call(this);
}
JS.extend(AtlasMeta,$super);
AtlasMeta['asset-type'] = 'atlas';
AtlasMeta.prototype.useRawfile = function () {
    return false;
};
AtlasMeta.prototype.dest = function ( assetdb ) {
    return [
        assetdb._uuidToImportPathNoExt( this.uuid ) + '.atlas',
    ];
};
AtlasMeta.prototype.import = function ( assetdb, fspath, cb ) {
    assetdb.copyAssetToLibrary( this.uuid, fspath );
    if ( cb ) cb ();
};

// AtlasFolderMeta
function AtlasFolderMeta () {
    $super.call(this);
}
JS.extend(AtlasFolderMeta,$super);
AtlasFolderMeta['asset-type'] = 'atlas';
AtlasFolderMeta.prototype.useRawfile = function () {
    return false;
};
AtlasFolderMeta.prototype.dest = function ( assetdb ) {
    return [
        assetdb._uuidToImportPathNoExt( this.uuid ) + '.atlas',
    ];
};
AtlasFolderMeta.prototype.import = function ( assetdb, fspath, cb ) {
    assetdb.saveAssetToLibrary( this.uuid, {
        name: 'atlas-folder'
    }, '.atlas');
    if ( cb ) cb ();
};

// ----------------
// init db
// ----------------

var _assetdb;
var _src;
var _dest;

function assetdb () {
    return _assetdb;
}

function init ( path, registerMeta ) {
    _src = Path.join( __dirname, 'fixtures', path );
    _dest = Path.join( __dirname, 'playground', path );

    beforeEach(function (done) {
        Fs.copySync( _src, _dest );

        _assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });

        Meta.register(_assetdb, '.png', false, ImageMeta);
        Meta.register(_assetdb, '.png', false, ParticleImageMeta);

        Meta.register(_assetdb, '.atlas', true, AtlasFolderMeta);
        Meta.register(_assetdb, '.atlas', false, AtlasMeta);

        Meta.register(_assetdb, '.raw', false, Meta.AssetMeta);
        Meta.register(_assetdb, '.asset', false, ImportAssetMeta);

        if ( registerMeta ) registerMeta(_assetdb);

        Async.series([
            function ( next ) {
                _assetdb.mount( _dest, 'assets', Static.MountType.asset, next );
            },

            function ( next ) {
                _assetdb.init( next );
            },
        ], function () {
            done();
        });
    });

    afterEach(function (done) {
        Del(Path.join( __dirname, 'playground'), { force: true }, done);
    });
}

function assetpath ( path ) {
    return Path.join( _dest, path);
}

// ----------------
// exports
// ----------------

module.exports = {
    extend: JS.extend,

    //
    AssetMeta: Meta.AssetMeta,
    FolderMeta: Meta.FolderMeta,
    ParticleImageMeta: ParticleImageMeta,
    ImageMeta: ImageMeta,
    AtlasMeta: AtlasMeta,
    AtlasFolderMeta: AtlasFolderMeta,
    ImportAssetMeta: ImportAssetMeta,

    //
    assetdb: assetdb,
    init: init,
    assetpath: assetpath,
};
