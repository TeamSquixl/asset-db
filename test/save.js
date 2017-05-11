var Path = require('fire-path');
var Fs = require('fire-fs');
var Del = require('del');

//
var Utils = require('./utils');

describe('Test save', function () {
    // custom meta
    function CustomMeta () {
        Utils.ImportAssetMeta.call(this);
    }
    Utils.extend(CustomMeta, Utils.ImportAssetMeta);
    CustomMeta.prototype.deserialize = function ( jsonObj ) {
        Utils.ImportAssetMeta.prototype.deserialize.call(this, jsonObj);
    };
    CustomMeta.prototype.import = function ( assetdb, fspath, cb ) {

        var basename = Path.basename(fspath);

        var asset = {
            _name: Path.basenameNoExt(fspath),
        };

        assetdb.saveAssetToLibrary( this.uuid, asset, '.asset' );

        if (cb) cb();
    };

    Utils.init('save-assets', function ( assetdb ) {
        assetdb.register('.asset', false, CustomMeta);
    });

    it('should return erro if url not exists', function (done) {
        var assetdb = Utils.assetdb();

        var url = 'assets://b.asset';

        assetdb.save(url, '', function (err) {
            assert(err);
            done();
        });
    });

    it('should save file if pass data', function (done) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a.asset';
        var fspath = assetdb._fspath(url);
        var uuid = assetdb.fspathToUuid(fspath);

        var json = {tt: 123};
        var data = JSON.stringify(json);

        var oldMtime = assetdb._uuid2mtime[uuid];

        assetdb.save(url, data, function (err) {
            assert(!err);

            var file = JSON.parse( Fs.readFileSync(fspath) );

            var newMtime = assetdb._uuid2mtime[uuid];

            expect( file ).to.be.deep.equal( json );
            expect( newMtime ).to.not.equal( oldMtime );

            done();
        });
    });

});
