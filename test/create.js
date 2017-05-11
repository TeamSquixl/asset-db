var Path = require('fire-path');
var Fs = require('fire-fs');

//
var Utils = require('./utils');

describe('Test create', function () {
    function PngMeta () {
        Utils.ImportAssetMeta.call(this);
    }
    Utils.extend(PngMeta, Utils.ImportAssetMeta);
    PngMeta['asset-type'] = 'png';
    PngMeta.prototype.export = function (path, data, cb) {
        Fs.writeFile(path, data, cb);
    };

    Utils.init('create-assets/assets', function ( assetdb ) {
        assetdb.register('.png', false, PngMeta);
        assetdb.register('.asset', false, Utils.ImportAssetMeta);
    });

    var buffer;

    before( function (done) {
        Fs.readFile( Path.join(__dirname, 'fixtures/create-assets/temp/a.png'), function (err, data) {
            buffer = data;
            done(err);
        });
    });

    it('should return error if url is already exists', function (done) {
        var assetdb = Utils.assetdb();
        var url = 'assets://a.png';

        assetdb.create(url, buffer, function (err) {
            assert(err);
            done();
        });
    });

    it('should return error if url\'s parent dir is not exists', function (done) {
        var assetdb = Utils.assetdb();
        var url = 'assets://a/a.png';

        assetdb.create(url, buffer, function (err) {
            assert(err);
            done();
        });
    });

    it('should create an asset if meta implements export', function (done) {
        var assetdb = Utils.assetdb();
        var url = 'assets://b.png';
        var path = assetdb._fspath(url);

        assetdb.create(url, buffer, function (err, results) {
            assert(!err);

            var uuid = assetdb.fspathToUuid(path);

            assert( uuid );
            assert( results );
            expect( results.length ).to.equal( 1 );
            expect( results[0] ).to.be.deep.equal( {
                uuid: uuid,
                parentUuid: 'mount-assets',
                url: assetdb._url(path),
                path: path,
                type:'png',
            });
            expect( Fs.existsSync(path) ).to.be.true;
            expect( assetdb._uuid2mtime[uuid] ).to.not.be.undefined;

            done();
        });
    });

    it('should get error if meta not implements export', function (done) {
        var assetdb = Utils.assetdb();
        var url = 'assets://a.asset';

        assetdb.create(url, buffer, function (err) {
            assert(err);
            done();
        });
    });

});
