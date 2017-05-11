var Path = require('fire-path');
var Fs = require('fire-fs');
var Globby = require('globby');
var Sinon = require('sinon');

//
var Utils = require('./utils');

describe('Test delete', function () {
    Utils.init('delete-assets');

    it('should return error if url is not exists', function (done) {
        var assetdb = Utils.assetdb();
        var url = 'assets://a-folder-with-a-asset/b.asset';

        assetdb.delete(url, function (err) {
            assert(err);
            done();
        });
    });

    it('should delete asset, meta, imported assets and delete uuid infos if asset is a file', function (done) {
        var assetdb = Utils.assetdb();
        var url = 'assets://a-folder-with-a-asset/a.asset';
        var path  = assetdb._fspath(url);
        var metaPath  = path + '.meta';

        var importPath = assetdb._fspathToImportPathNoExt(path);
        var importFolder = Path.join(Path.dirname(importPath), Path.basenameNoExt(importPath));

        assetdb.delete(url, function (err) {
            if (err) throw err;
            assert(!err);

            expect( Fs.existsSync(path) ).to.not.be.true;
            expect( Fs.existsSync(metaPath) ).to.not.be.true;
            expect( Fs.existsSync(importPath) ).to.not.be.true;
            expect( Fs.existsSync(importFolder) ).to.not.be.true;

            expect( assetdb.fspathToUuid(path) ).to.be.undefined;

            done();
        });
    });

    it('should delete every asset, meta, imported assets and delete uuid infos if asset is a folder', function (done) {
        var assetdb = Utils.assetdb();
        var url = 'assets://a-folder-with-several-assets';
        var path  = assetdb._fspath(url);
        var metaPath  = path + '.meta';

        var pattern = [path, Path.join(path, '**/*'), '!'+Path.join(path, '**/*.meta')];

        Globby( pattern, function ( err, paths ) {


            var importPaths = paths.map( function (path) {

                var importPath = assetdb._fspathToImportPathNoExt(path);
                var importFolder = Path.join(Path.dirname(importPath), Path.basenameNoExt(importPath));

                return [importPath, importFolder];
            });

            var uuids = paths.map( function (path) {
                return assetdb.fspathToUuid(path);
            });

            assetdb.delete(url, function (err) {
                if (err) throw err;
                assert(!err);

                expect( Fs.existsSync(path) ).to.not.be.true;
                expect( Fs.existsSync(metaPath) ).to.not.be.true;

                expect( assetdb.fspathToUuid(path) ).to.be.undefined;

                importPaths.forEach( function (path) {
                    expect( Fs.existsSync(path[0]) ).to.not.be.true;
                    expect( Fs.existsSync(path[1]) ).to.not.be.true;
                });

                paths.forEach( function (path) {
                    expect( assetdb.fspathToUuid(path) ).to.be.undefined;
                });

                uuids.forEach( function (uuid) {
                    expect( assetdb._uuid2mtime[uuid] ).to.be.undefined;
                });

                done();
            });
        });

    });

});

describe( 'Test delete asset with meta.delete method', function () {
    function DeleteMeta () {
        Utils.ImportAssetMeta.call(this);
    }
    Utils.extend(DeleteMeta, Utils.ImportAssetMeta);
    DeleteMeta.prototype.delete = function (assetdb, fspath, cb) {
        if (cb) cb();
    };
    var spy = Sinon.spy(DeleteMeta.prototype, 'delete');

    Utils.init('delete-assets', function ( assetdb ) {
        assetdb.register('.dm', false, DeleteMeta);
    });

    afterEach ( function ( done ) {
        spy.reset();
        done();
    });

    it( 'should get no error if meta not implements delete', function (done) {
        var assetdb = Utils.assetdb();
        assetdb.delete( 'assets://a.asset', function (err) {
            assert( !err );
            done();
        });
    });

    it( 'should trigger meta.delete if meta implements delete', function (done) {
        var assetdb = Utils.assetdb();
        assetdb.delete( 'assets://a.dm', function (err) {
            assert( spy.called );
            done();
        });
    });

});

// describe('Tasks.rawDelete', function () {
//     var src = Path.join( __dirname, 'fixtures/mount-type' );
//     var dest = Path.join( __dirname, 'playground/mount-type' );

//     var rawDest = Path.join(dest, 'raw');

//     beforeEach(function ( done ) {
//         assetdb = new AssetDB({
//             cwd: Path.join( __dirname, 'playground' ),
//             library: 'library',
//         });

//         Fs.copySync( src, dest );

//         Async.series([
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


//     it('should report error if url is not exists and is raw mount type', function (done) {
//         var url = 'raw://not-exists.asset';

//         assetdb.delete(url, function (err) {
//             console.log(err);
//             assert(err);
//             done();
//         });
//     });

//     it('should call Tasks.rawDelete if asset is raw mount type', function (done) {
//         var url = 'raw://an-asset.atlas';
//         var path  = assetdb._fspath(url);

//         var spy = Sinon.spy(Tasks, 'rawDelete');

//         assetdb.delete(url, function (err) {

//             assert( spy.called );
//             done();
//         });
//     });

//     it('should delete asset if asset is a file and is raw mount type', function (done) {
//         var url = 'raw://an-asset.atlas';
//         var path  = assetdb._fspath(url);

//         assetdb.delete(url, function (err) {
//             if (err) throw err;
//             assert(!err);

//             expect( Fs.existsSync(path) ).to.not.be.true;

//             done();
//         });
//     });

//     it('should delete every asset if asset is a folder and is raw mount type', function (done) {
//         var url = 'raw://a-folder';
//         var path  = assetdb._fspath(url);

//         var pattern = [path, Path.join(path, '**/*'), '!'+Path.join(path, '**/*.meta')];

//         Globby( pattern, function ( err, paths ) {

//             assetdb.delete(url, function (err, results) {
//                 if (err) throw err;
//                 assert(!err);

//                 expect( results.length ).to.be.equal( 4 );
//                 expect( Fs.existsSync(path) ).to.not.be.true;

//                 done();
//             });
//         });

//     });
// });
