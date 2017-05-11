var Path = require('fire-path');
var Fs = require('fire-fs');
var Del = require('del');

//
var Utils = require('./utils');

describe('Test saveMeta', function () {

    // custom meta
    function CustomMeta () {
        Utils.ImportAssetMeta.call(this);
        this.number = 1;
    }
    Utils.extend(CustomMeta, Utils.ImportAssetMeta);
    CustomMeta.prototype.deserialize = function ( jsonObj ) {
        Utils.ImportAssetMeta.prototype.deserialize.call(this, jsonObj);
        this.number = jsonObj.number;
    };
    CustomMeta.prototype.import = function ( assetdb, fspath, cb ) {

        var basename = Path.basename(fspath);

        var asset = {
            _name: Path.basenameNoExt(fspath),
            number: this.number
        };

        assetdb.saveAssetToLibrary( this.uuid, asset, '.asset' );

        if (cb) cb();
    };
    Utils.init('save-meta', function ( assetdb ) {
        assetdb.register('.asset', false, CustomMeta);
    });

    it('should save meta and reimport asset', function (done) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a.asset';
        var uuid = assetdb.urlToUuid(url);
        var fspath = assetdb.uuidToFspath(uuid);
        var metaPath = fspath + '.meta';

        var importPath = assetdb._fspathToImportPathNoExt(fspath) + '.asset';

        var meta = new CustomMeta();
        meta.uuid = uuid;
        meta.number = 2;

        var jsonString = JSON.stringify(meta);

        var oldMtime = assetdb._uuid2mtime[uuid];

        assetdb.saveMeta(uuid, jsonString, function (err) {
            assert(!err);

            var metaJson = JSON.parse( Fs.readFileSync(metaPath) );
            var assetJson = JSON.parse( Fs.readFileSync(importPath) );
            var newMtime = assetdb._uuid2mtime[uuid];

            expect( metaJson.number ).to.equal( 2 );
            expect( assetJson.number ).to.equal( 2 );
            expect( newMtime ).to.not.equal( oldMtime );

            done();
        });
    });

    it('should return error if uuid is not equal to json\'s uuid', function (done) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a.asset';
        var uuid = assetdb.urlToUuid(url);

        var meta = new CustomMeta();
        meta.uuid = '123-456-789';
        meta.number = 2;

        var jsonString = JSON.stringify(meta);

        assetdb.saveMeta(uuid, jsonString, function (err) {
            assert(err);

            done();
        });
    });

});
