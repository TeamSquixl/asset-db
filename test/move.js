var Path = require('fire-path');
var Fs = require('fire-fs');
var Globby = require('globby');
var Async = require('async');

//
var Static = require('../lib/static');
var Utils = require('./utils');

describe('Test move', function () {
    Utils.init('move-assets');

    function getAssetJson(fspath) {
        var assetdb = Utils.assetdb();

        var importPath = assetdb._fspathToImportPathNoExt(fspath) + '.asset';
        var text = Fs.readFileSync( importPath, {encoding: 'utf-8'} );
        var json = JSON.parse(text);
        return json;
    }


    it('should return error if srcUrl is not exists', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl  = 'assets://a-folder-with-a-asset/b.asset';
        var destUrl = 'assets://a-folder/a.asset';

        assetdb.move(srcUrl, destUrl, function (err) {
            assert(err);
            done();
        });
    });

    it('should return error if destUrl\'s parent path is not exists', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl  = 'assets://a-folder-with-a-asset/a.asset';
        var destUrl = 'assets://a-folder/a/a.asset';

        assetdb.move(srcUrl, destUrl, function (err) {
            assert(err);
            done();
        });
    });

    it('should return error if destUrl is a normal asset, and already exists', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl  = 'assets://a-folder-with-a-asset/a.js';
        var destUrl = 'assets://b-folder-with-a-asset/a.js';

        assetdb.move(srcUrl, destUrl, function (err) {
            assert(err);
            done();
        });
    });

    it('should return error if destUrl is a folder, and already exists', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl  = 'assets://a-folder';
        var destUrl = 'assets://b-folder-with-a-asset';

        assetdb.move(srcUrl, destUrl, function (err) {
            assert(err);
            done();
        });
    });

    it('should return error if destUrl and srcUrl both are folder and destUrl already has an item named with srcUrl\'s name', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl  = 'assets://a-folder';
        var destUrl = 'assets://b-folder-with-a-folder';

        assetdb.move(srcUrl, destUrl, function (err) {
            assert(err);
            done();
        });
    });

    it('should return error if destUrl and srcUrl both are folder but destUrl exists', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl  = 'assets://a-folder-with-several-assets';
        var destUrl = 'assets://a-folder';

        assetdb.move(srcUrl, destUrl, function (err) {
            assert(err);
            done();
        });
    });

    it('should move asset, update asset-db, update imported asset if srcUrl is a normal asset and destUrl is not exists', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl = 'assets://a-folder-with-a-asset/a.asset';
        var destUrl = 'assets://b-folder/a.asset';

        var srcPath  = assetdb._fspath(srcUrl);
        var destPath = assetdb._fspath(destUrl);

        assetdb.move(srcUrl, destUrl, function (err, results) {

            var json = getAssetJson(destPath);
            var uuid = assetdb.fspathToUuid(destPath);

            assert(!err);

            expect( Fs.existsSync(destPath) ).to.be.equal(true);
            expect( uuid ).to.not.be.undefined;
            expect( json._name ).equal('a');

            expect( results[0].srcPath ).to.equal( srcPath );
            expect( results[0].destPath ).to.equal( destPath );
            expect( results[0].srcMountType ).to.equal( Static.MountType.asset );
            expect( results[0].destMountType ).to.equal( Static.MountType.asset );
            expect( results[0].uuid ).to.equal( uuid );

            done();
        });
    });

    it('should move asset, update asset-db, update imported asset if rename srcUrl', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl = 'assets://a-folder-with-a-asset/a.asset';
        var destUrl = 'assets://a-folder-with-a-asset/b.asset';

        var srcPath  = assetdb._fspath(srcUrl);
        var destPath = assetdb._fspath(destUrl);

        assetdb.move(srcUrl, destUrl, function (err) {

            var json = getAssetJson(destPath);

            assert(!err);

            expect( Fs.existsSync(destPath) ).to.be.equal(true);
            expect( assetdb.fspathToUuid(destPath) ).to.not.be.undefined;
            // expect( json._name ).equal('b');

            done();
        });
    });

    it('should move asset, update asset-db, update imported asset if change asset from lowercase to uppercase ', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl = 'assets://a-folder-with-a-asset/a.asset';
        var destUrl = 'assets://a-folder-with-a-asset/A.asset';

        var srcPath  = assetdb._fspath(srcUrl);
        var destPath = assetdb._fspath(destUrl);

        assetdb.move(srcUrl, destUrl, function (err) {

            var json = getAssetJson(destPath);

            assert(!err);

            expect( Fs.existsSync(destPath) ).to.be.equal(true);
            expect( assetdb.fspathToUuid(destPath) ).to.not.be.undefined;
            // expect( json._name ).equal('A');

            done();
        });
    });

    function doExpect(srcUrl, destUrl, done) {
        var assetdb = Utils.assetdb();

        var srcPath  = assetdb._fspath(srcUrl);
        var destPath = assetdb._fspath(destUrl);

        var pattern = [srcPath, Path.join(srcPath, '**/*'), '!'+Path.join(srcPath, '**/*.meta')];

        Globby(pattern, function (err, srcPaths) {
            srcPaths = srcPaths.map( function (path) {
                return Path.normalize(path);
            });

            var uuids = srcPaths.map( function (path) {
                return assetdb.fspathToUuid(path);
            });


            var oldMtimes = {};
            uuids.forEach( function (uuid) {
                oldMtimes[uuid] = assetdb._uuid2mtime[uuid];
            });

            assetdb.move(srcUrl, destUrl, function (err) {
                assert(!err);

                pattern = [destPath, Path.join(destPath, '**/*'), '!'+Path.join(destPath, '**/*.meta')];

                Globby( pattern, function ( err, destPaths ) {

                    destPaths = destPaths.map( function (path) {
                        return Path.normalize(path);
                    });

                    var metas = destPaths.map(function (path) {
                        expect( assetdb.fspathToUuid(path) ).to.not.be.undefined;
                        return path + '.meta';
                    });

                    metas.forEach(function (path) {
                        expect( Fs.existsSync(path) ).to.be.equal(true);
                    });

                    uuids.forEach( function (uuid) {
                        expect( oldMtimes[uuid] ).to.not.equal( assetdb._uuid2mtime[uuid] );
                    });

                    done();

                });
            });
        });
    }

    it('should move asset, update asset-db if srcUrl is a folder and destUrl is not exists', function (done) {
        var srcUrl  = 'assets://a-folder-with-several-assets';
        var destUrl = 'assets://a-folder/b';

        doExpect(srcUrl, destUrl, done);
    });

    it('should move asset, update asset-db if srcUrl is a folder and rename srcUrl', function (done) {
        var srcUrl  = 'assets://a-folder-with-several-assets';
        var destUrl = 'assets://b-folder-with-several-assets';

        doExpect(srcUrl, destUrl, done);
    });

    it('should move asset, update asset-db if change srcUrl from lowercase to uppercase', function (done) {
        var srcUrl  = 'assets://a-folder-with-several-assets';
        var destUrl = 'assets://A-folder-With-several-assets';

        doExpect(srcUrl, destUrl, done);
    });
});

describe('Test rename', function () {
    function CustomMeta () {
        Utils.AssetMeta.call(this);
    }
    Utils.extend(CustomMeta, Utils.AssetMeta);
    CustomMeta.prototype.import = function ( assetdb, fspath, cb ) {
        var self = this;

        Async.waterfall([
            function ( next ) {
                var basename = Path.basename(fspath);

                var asset = {
                    _name: Path.basenameNoExt(fspath)
                };
                assetdb.saveAssetToLibrary( self.uuid, asset, '.asset' );

                next ( null );
            }
        ], cb);
    };

    Utils.init('move-assets', function ( assetdb ) {
        assetdb.register('.asset', false, CustomMeta);
    });

    it('should reimport asset if rename srcUrl', function (done) {
        var assetdb = Utils.assetdb();

        var srcUrl = 'assets://a-folder-with-a-asset/a.asset';
        var destUrl = 'assets://a-folder-with-a-asset/b.asset';

        var srcPath  = assetdb._fspath(srcUrl);
        var destPath = assetdb._fspath(destUrl);

        var uuid = assetdb.fspathToUuid(srcPath);
        var importPath = assetdb._fspathToImportPathNoExt(srcPath) + '.asset';

        expect( Fs.existsSync( importPath ) ).to.be.true;

        assetdb.move(srcUrl, destUrl, function (err) {

            assert(!err);

            expect( Fs.existsSync( importPath ) ).to.be.true;

            done();
        });
    });
});

// describe('Tasks.move', function () {
//     var src = Path.join( __dirname, 'fixtures/mount-type' );
//     var dest = Path.join( __dirname, 'playground/mount-type' );

//     var metaDest = Path.join(dest, 'meta');
//     var rawDest = Path.join(dest, 'raw');

//     beforeEach(function ( done ) {
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

//     afterEach( function ( done ) {
//         Del( Path.join( __dirname, 'playground' ), done );
//     });


//     it('should call Tasks.rawMove and move between raw folder if both srcUrl and destUrl type are raw mount type', function (done) {
//         var srcUrl = 'raw://a.asset';
//         var destUrl = 'raw://a-folder/a.asset';

//         var srcPath = assetdb._fspath(srcUrl);
//         var destPath = assetdb._fspath(destUrl);

//         var spy = Sinon.spy(Tasks, 'rawMove');

//         assetdb.move(srcUrl, destUrl, function (err, results) {
//             assert( spy.called );

//             expect( Fs.existsSync(srcPath) ).to.be.false;
//             expect( Fs.existsSync(destPath) ).to.be.true;


//             expect( results[0].srcPath ).to.equal( srcPath );
//             expect( results[0].destPath ).to.equal( destPath );
//             expect( results[0].srcMountType ).to.equal( Static.MountType.raw );
//             expect( results[0].destMountType ).to.equal( Static.MountType.raw );

//             done();
//         });
//     });

//     it('should report error if srcUrl type is meta type and destUrl type is raw type but destUrl is exists', function (done) {
//         var srcUrl = 'assets://an-asset.atlas';
//         var destUrl = 'raw://an-asset.atlas';

//         assetdb.move(srcUrl, destUrl, function (err) {
//             console.log( err );
//             assert( err );
//             done();
//         });
//     });

//     it('should copy srcUrl file from assets to raw folder and delete asset and imported asset from assets folder if srcUrl type is meta type and destUrl type is raw type', function (done) {
//         var srcUrl = 'assets://an-asset.atlas';
//         var destUrl = 'raw://a-folder/b.atlas';

//         var destPath = assetdb._fspath(destUrl);

//         var srcPath = assetdb._fspath(srcUrl);
//         var srcImportPath = assetdb._fspathToImportPathNoExt(srcPath);
//         var srcMetaPath = assetdb._fspathToImportPathNoExt(srcPath);
//         var srcUuid = assetdb.fspathToUuid(srcPath);

//         assetdb.move(srcUrl, destUrl, function (err, results) {

//             expect( Fs.existsSync(destPath) ).to.be.true;

//             expect( Fs.existsSync(srcPath) ).to.be.false;
//             expect( Fs.existsSync(srcImportPath) ).to.be.false;
//             expect( Fs.existsSync(srcMetaPath) ).to.be.false;
//             expect( assetdb.fspathToUuid(srcPath) ).to.be.undefined;
//             expect( assetdb._uuid2mtime[srcUuid] ).to.be.undefined;

//             expect( results.length ).to.equal( 1 );
//             expect( results[0].srcPath ).to.be.equal( srcPath );
//             expect( results[0].srcMountType ).to.be.equal( Static.MountType.asset );
//             expect( results[0].destMountType ).to.be.equal( Static.MountType.raw );
//             expect( results[0].uuid ).to.be.equal( srcUuid );

//             done();
//         });
//     });

//     it('should copy srcUrl folder from assets to raw folder and delete asset and imported asset from assets folder if srcUrl type is meta type and destUrl type is raw type', function (done) {
//         var srcUrl = 'assets://a-folder';
//         var destUrl = 'raw://a-folder/b-folder';

//         var destPath = assetdb._fspath(destUrl);
//         var srcPath = assetdb._fspath(srcUrl);

//         var pattern = [srcPath, Path.join(srcPath, '**/*'), '!'+Path.join(srcPath, '**/*.meta')];

//         Globby(pattern, function (err, paths) {
//             var needChecked = paths.map( function (path) {
//                 path = Path.resolve(path);

//                 return {
//                     path: path,
//                     importPath: assetdb._fspathToImportPathNoExt(path),
//                     metaPath: path + '.meta',
//                     uuid: assetdb.fspathToUuid(path)
//                 }
//             });

//             assetdb.move(srcUrl, destUrl, function (err, results) {

//                 expect( Fs.existsSync(srcPath) ).to.be.false;
//                 expect( Fs.existsSync(destPath) ).to.be.true;
//                 expect( Fs.existsSync(Path.join(destPath, 'an-asset.asset.meta')) ).to.be.false;

//                 needChecked.forEach( function (check, index) {
//                     expect( Fs.existsSync(check.path) ).to.be.false;
//                     expect( Fs.existsSync(check.importPath) ).to.be.false;
//                     expect( Fs.existsSync(check.metaPath) ).to.be.false;
//                     expect( assetdb.fspathToUuid(check.path) ).to.be.undefined;
//                     expect( assetdb._uuid2mtime[check.uuid] ).to.be.undefined;


//                     expect( results[index].srcPath ).to.be.equal( check.path );
//                     expect( results[index].srcMountType ).to.be.equal( Static.MountType.asset );
//                     expect( results[index].destMountType ).to.be.equal( Static.MountType.raw );
//                     expect( results[index].uuid ).to.be.equal( check.uuid );

//                 });

//                 expect( results.length ).to.equal( 4 );

//                 done();
//             });

//         });
//     });

//     it('should import srcUrl file to destUrl if srcUrl type is raw type and destUrl type is meta type', function (done) {
//         var srcUrl = 'raw://an-asset.atlas';
//         var destUrl = 'assets://a-folder/b.atlas';

//         var destPath = assetdb._fspath(destUrl);
//         var srcPath = assetdb._fspath(srcUrl);

//         assetdb.move(srcUrl, destUrl, function (err) {

//             var importPath = assetdb._fspathToImportPathNoExt(destPath);
//             var metaPath = assetdb._fspathToImportPathNoExt(destPath);
//             var uuid = assetdb.fspathToUuid(destPath);

//             expect( Fs.existsSync(destPath) ).to.be.true;
//             expect( Fs.existsSync(srcPath) ).to.be.false;

//             expect( Fs.existsSync(importPath) ).to.be.true;
//             expect( Fs.existsSync(metaPath) ).to.be.true;
//             expect( assetdb.fspathToUuid(destPath) ).to.not.be.undefined;
//             expect( assetdb._uuid2mtime[uuid] ).to.not.be.undefined;

//             done();
//         });
//     });

//     it('should copy srcUrl folder from assets to raw folder and delete asset and imported asset from assets folder if srcUrl type is meta type and destUrl type is raw type', function (done) {
//         var srcUrl = 'raw://a-folder';
//         var destUrl = 'assets://a-folder/b-folder';

//         var destPath = assetdb._fspath(destUrl);
//         var srcPath = assetdb._fspath(srcUrl);

//         assetdb.move(srcUrl, destUrl, function (err, results) {
//             var pattern = [destPath, Path.join(destPath, '**/*'), '!'+Path.join(destPath, '**/*.meta')];

//             Globby(pattern, function (err, paths) {
//                 var needChecked = paths.map( function (path) {
//                     path = Path.resolve(path);

//                     return {
//                         path: path,
//                         importPath: assetdb._fspathToImportPathNoExt(path),
//                         metaPath: path + '.meta',
//                         uuid: assetdb.fspathToUuid(path)
//                     }
//                 });

//                 expect( Fs.existsSync(srcPath) ).to.be.false;
//                 expect( Fs.existsSync(destPath) ).to.be.true;

//                 needChecked.forEach( function (check, index) {

//                     if ( !Fs.isDirSync(check.path) ) {
//                         expect( Fs.existsSync(check.importPath) ).to.be.true;
//                         expect( assetdb._uuid2mtime[check.uuid] ).to.not.be.undefined;
//                     }
//                     expect( Fs.existsSync(check.path) ).to.be.true;
//                     expect( Fs.existsSync(check.metaPath) ).to.be.true;
//                     expect( assetdb.fspathToUuid(check.path) ).to.not.be.undefined;

//                     expect( results[index].destPath ).to.be.equal( check.path );
//                     expect( results[index].srcMountType ).to.be.equal( Static.MountType.raw );
//                     expect( results[index].destMountType ).to.be.equal( Static.MountType.asset );
//                     expect( results[index].uuid ).to.be.equal( check.uuid );

//                 });

//                 expect( results.length ).to.equal( 4 );

//                 done();
//             });

//         });
//     });
// });
