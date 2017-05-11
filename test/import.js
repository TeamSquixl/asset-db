var Path = require('fire-path');
var Fs = require('fire-fs');
var Globby = require('globby');

//
var Utils = require('./utils');

describe('Test import', function () {
    Utils.init('import-assets/assets');
    var importPath = Path.join( __dirname, 'fixtures/import-assets/assets-to-import' );

    it('should report error if dest path not exists', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'foobar.asset'),
        ], 'assets://a-folder-not-exists', function (err, results) {
            expect( err ).not.to.be.null;
            done();
        });
    });

    it('should report error if dest path is not a folder', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'foobar.asset'),
        ], 'assets://a.asset', function (err, results) {
            expect( err ).not.to.be.null;
            done();
        });
    });

    it('should report error and skip import file that has the same name in dest path', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'foobar.asset'),
            Path.join(importPath, 'a.asset'),
        ], 'assets://', function (err, results) {
            var uuid = assetdb.urlToUuid( 'assets://foobar.asset' );
            var path = assetdb._fspath( 'assets://foobar.asset' );

            expect(results.length).to.be.equal(1);
            expect(uuid).to.be.equal(results[0].uuid);
            expect(path).to.be.equal(results[0].path);

            done();
        });
    });

    it('should report error and skip import file that has the same name in rawfiles', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'foobar.asset'),
            Path.join(importPath, 'another-foobar/foobar.asset'),
        ], 'assets://', function (err, results) {
            var uuid = assetdb.urlToUuid( 'assets://foobar.asset' );
            var path = assetdb._fspath( 'assets://foobar.asset' );

            expect(results.length).to.be.equal(1);
            expect(uuid).to.be.equal(results[0].uuid);
            expect(path).to.be.equal(results[0].path);

            done();
        });
    });

    it('should copy a file to the path we specific, and import it after that', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'foobar.asset'),
        ], 'assets://', function (err, results) {
            var uuid = assetdb.urlToUuid( 'assets://foobar.asset' );
            var path = assetdb._fspath( 'assets://foobar.asset' );

            expect(results.length).to.be.equal(1);
            expect(uuid).to.be.equal(results[0].uuid);
            expect(path).to.be.equal(results[0].path);

            done();
        });
    });

    it('should copy multiple files to the path we specific, and import it after that', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'foo-bar/foo-01.asset'),
            Path.join(importPath, 'foo-bar/foo-02.asset'),
            Path.join(importPath, 'foo-bar/foo-03.asset'),
        ], 'assets://', function (err, results) {
            expect(results.length).to.be.equal(3);

            expect(assetdb.urlToUuid('assets://foo-01.asset')).to.be.equal(results[0].uuid);
            expect(assetdb._fspath('assets://foo-01.asset')).to.be.equal(results[0].path);

            expect(assetdb.urlToUuid('assets://foo-02.asset')).to.be.equal(results[1].uuid);
            expect(assetdb._fspath('assets://foo-02.asset')).to.be.equal(results[1].path);

            expect(assetdb.urlToUuid('assets://foo-03.asset')).to.be.equal(results[2].uuid);
            expect(assetdb._fspath('assets://foo-03.asset')).to.be.equal(results[2].path);

            done();
        });
    });

    it('should copy a folder to the path we specific, and import it and the files in it after that', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'foo-bar'),
        ], 'assets://', function (err, results) {
            expect(results.length).to.be.equal(4);

            expect(assetdb.urlToUuid('assets://foo-bar')).to.be.equal(results[0].uuid);
            expect(assetdb._fspath('assets://foo-bar')).to.be.equal(results[0].path);
            expect(results[0].type).to.be.equal('folder');

            expect(assetdb.urlToUuid('assets://foo-bar/foo-01.asset')).to.be.equal(results[1].uuid);
            expect(assetdb._fspath('assets://foo-bar/foo-01.asset')).to.be.equal(results[1].path);
            expect(results[1].type).to.be.equal('import-asset');

            expect(assetdb.urlToUuid('assets://foo-bar/foo-02.asset')).to.be.equal(results[2].uuid);
            expect(assetdb._fspath('assets://foo-bar/foo-02.asset')).to.be.equal(results[2].path);

            expect(assetdb.urlToUuid('assets://foo-bar/foo-03.asset')).to.be.equal(results[3].uuid);
            expect(assetdb._fspath('assets://foo-bar/foo-03.asset')).to.be.equal(results[3].path);

            done();
        });
    });

    it('should remain the uuid if we import file with its meta together', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'an-asset-with-meta.asset'),
            Path.join(importPath, 'an-asset-with-meta.asset.meta'),
        ], 'assets://', function (err, results) {
            var metaPath = Path.join(importPath, 'an-asset-with-meta.asset.meta');
            var metaJson = JSON.parse(Fs.readFileSync(metaPath));
            var uuidInMeta = metaJson.uuid;
            var uuid = assetdb.urlToUuid( 'assets://an-asset-with-meta.asset' );

            expect(results.length).to.be.equal(1);
            expect(uuidInMeta).to.be.equal(results[0].uuid);
            expect(uuid).to.be.equal(results[0].uuid);

            done();
        });
    });

    it('should remove meta file if rawfile not exists', function (done) {
        var assetdb = Utils.assetdb();

        assetdb.import([
            Path.join(importPath, 'an-asset-with-meta.asset.meta'),
        ], 'assets://', function (err, results) {
            expect(results.length).to.be.equal(0);

            done();
        });
    });
});


// describe('Tasks.rawImport', function () {
//     var src = Path.join( __dirname, 'fixtures/mount-type' );
//     var dest = Path.join( __dirname, 'playground/mount-type' );
//     var importPath = Path.join( __dirname, 'fixtures/import-assets/assets-to-import' );

//     var metaDest = Path.join(dest, 'meta');
//     var rawDest = Path.join(dest, 'raw');

//     before(function ( done ) {
//         assetdb = new AssetDB({
//             cwd: Path.join( __dirname, 'playground' ),
//             library: 'library',
//         });

//         Fs.copySync( src, dest );

//         Async.series([
//             function (next) {
//                 assetdb.mount( metaDest, 'assets', Static.MountType.asset, function ( err ) {
//                     next ();
//                 });
//             },
//             function (next) {
//                 assetdb.mount( rawDest, 'raw', Static.MountType.raw, function ( err ) {
//                     next ();
//                 });
//             },
//             function (next) {
//                 assetdb.init(next);
//             }
//         ], function (err) {
//             done(err);
//         });
//     });

//     after( function ( done ) {
//         Del( Path.join( __dirname, 'playground' ), done );
//     });

//     it('should call Tasks.rawImport when import url is raw mount type', function (done) {
//         var spy = Sinon.spy(Tasks, 'rawImport');

//         assetdb.import([
//             Path.join(importPath, 'a.asset'),
//         ], 'raw://', function (err, results) {
//             assert( spy.called );

//             done();
//         });
//     });

//     it('should import to raw folder when import url is raw mount type', function (done) {
//         assetdb.import([
//             Path.join(importPath, 'foobar.js'),
//         ], 'raw://', function (err, results) {
//             var uuid = assetdb.urlToUuid( 'raw://foobar.js' );
//             var path = assetdb._fspath( 'raw://foobar.js' );

//             expect(results.length).to.be.equal(1);
//             expect(uuid).to.be.undefined;
//             expect(path).to.be.equal(results[0].path);

//             done();
//         });
//     });

//     it('should copy multiple files to the path we specific, and import it after that', function (done) {
//         assetdb.import([
//             Path.join(importPath, 'foo-bar/foo-01.js'),
//             Path.join(importPath, 'foo-bar/foo-02.js'),
//             Path.join(importPath, 'foo-bar/foo-03.js'),
//         ], 'raw://', function (err, results) {
//             expect(results.length).to.be.equal(3);

//             expect(assetdb.urlToUuid('raw://foo-01.js')).to.be.undefined;
//             expect(assetdb._fspath('raw://foo-01.js')).to.be.equal(results[0].path);

//             expect(assetdb.urlToUuid('raw://foo-02.js')).to.be.undefined;
//             expect(assetdb._fspath('raw://foo-02.js')).to.be.equal(results[1].path);

//             expect(assetdb.urlToUuid('raw://foo-03.js')).to.be.undefined;
//             expect(assetdb._fspath('raw://foo-03.js')).to.be.equal(results[2].path);

//             done();
//         });
//     });

//     it('should copy a folder to the path we specific, and import it and the files in it after that', function (done) {
//         assetdb.import([
//             Path.join(importPath, 'foo-bar'),
//         ], 'raw://', function (err, results) {
//             expect(results.length).to.be.equal(4);

//             expect(assetdb.urlToUuid('raw://foo-bar')).to.be.undefined;
//             expect(assetdb._fspath('raw://foo-bar')).to.be.equal(results[0].path);

//             expect(assetdb.urlToUuid('raw://foo-bar/foo-01.js')).to.be.undefined;
//             expect(assetdb._fspath('raw://foo-bar/foo-01.js')).to.be.equal(results[1].path);

//             expect(assetdb.urlToUuid('raw://foo-bar/foo-02.js')).to.be.undefined;
//             expect(assetdb._fspath('raw://foo-bar/foo-02.js')).to.be.equal(results[2].path);

//             expect(assetdb.urlToUuid('raw://foo-bar/foo-03.js')).to.be.undefined;
//             expect(assetdb._fspath('raw://foo-bar/foo-03.js')).to.be.equal(results[3].path);

//             done();
//         });
//     });

//     it('should also import .meta file if we import file with its meta together', function (done) {
//         assetdb.import([
//             Path.join(importPath, 'an-asset-with-meta.js'),
//             Path.join(importPath, 'an-asset-with-meta.js.meta'),
//         ], 'raw://', function (err, results) {
//             var path = assetdb._fspath( 'raw://an-asset-with-meta.js' );
//             var metaPath = assetdb._fspath( 'raw://an-asset-with-meta.js.meta' );

//             expect(results.length).to.be.equal(2);
//             expect(path).to.be.equal(results[0].path);
//             expect(metaPath).to.be.equal(results[1].path);

//             done();
//         });
//     });

// });
