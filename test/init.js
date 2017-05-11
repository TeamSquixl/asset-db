var Fs = require('fire-fs');
var Path = require('fire-path');
var Del = require('del');
var Async = require('async');

//
var AssetDB = require('../index');
var Meta = require('../lib/meta');
var Static = require('../lib/static');

//
var Utils = require('./utils');

describe('Test AssetDB.init', function () {
    var assetdb;

    describe('init-no-meta', function () {
        var src = Path.join( __dirname, 'fixtures/init/init-no-meta' );
        var dest = Path.join( __dirname, 'playground/init-no-meta' );

        beforeEach(function ( done ) {
            Fs.copySync( src, dest );

            assetdb = new AssetDB({
                cwd: Path.join( __dirname, 'playground' ),
                library: 'library',
            });

            Meta.register(assetdb, '.png', false, Utils.ImageMeta);
            Meta.register(assetdb, '.png', false, Utils.ParticleImageMeta);
            Meta.register(assetdb, '.atlas', true, Utils.AtlasFolderMeta);
            Meta.register(assetdb, '.atlas', false, Utils.AtlasMeta);
            Meta.register(assetdb, '.raw', false, Utils.AssetMeta);
            Meta.register(assetdb, '.asset', false, Utils.ImportAssetMeta);

            assetdb.mount( dest, 'assets', Static.MountType.asset, function ( err ) {
                done ();
            });
        });

        afterEach( function ( done ) {
            Del(Path.join( __dirname, 'playground'), { force: true }, done);
        });

        it('should create meta after init', function ( done ) {
            assetdb.init(function ( err ) {
                expect( Fs.existsSync( Path.join(dest,'a-folder.meta') ) ).to.be.equal(true);
                expect( Fs.existsSync( Path.join(dest,'a-folder/an-asset.asset.meta') ) ).to.be.equal(true);
                expect( Fs.existsSync( Path.join(dest,'an-asset.atlas.meta') ) ).to.be.equal(true);
                expect( Fs.existsSync( Path.join(dest,'an-folder-asset.atlas.meta') ) ).to.be.equal(true);
                expect( Fs.existsSync( Path.join(dest,'an-folder-asset.atlas/asset-in-folder-asset.png.meta') ) ).to.be.equal(true);

                var meta = Meta.load( assetdb, Path.join(dest,'a-folder.meta') );
                expect(meta).to.be.instanceof(Meta.FolderMeta);
                expect(meta['asset-type']).to.be.equal('folder');

                meta = Meta.load( assetdb, Path.join(dest,'an-asset.atlas.meta') );
                expect(meta).to.be.instanceof(Meta.AssetMeta);
                expect(meta['asset-type']).to.be.equal('atlas');
                expect( Fs.existsSync(assetdb._uuidToImportPathNoExt(meta.uuid)+'.atlas') ).to.be.equal(true);

                done();
            });
        });
    });

    describe('init-with-meta', function () {
        var src = Path.join( __dirname, 'fixtures/init/init-with-meta' );
        var dest = Path.join( __dirname, 'playground/init-with-meta' );
        var mtimeList = {};

        beforeEach(function ( done ) {
            Fs.copySync( src, dest );

            mtimeList = {
                'a-folder.meta': Fs.statSync( Path.join(dest,'a-folder.meta') ).mtime,
                'a-folder/an-asset.asset.meta': Fs.statSync( Path.join(dest,'a-folder/an-asset.asset.meta') ).mtime,
                'an-asset.atlas.meta': Fs.statSync( Path.join(dest,'an-asset.atlas.meta') ).mtime,
                'an-folder-asset.atlas.meta': Fs.statSync( Path.join(dest,'an-folder-asset.atlas.meta') ).mtime,
                'an-folder-asset.atlas/asset-in-folder-asset.png.meta': Fs.statSync( Path.join(dest,'an-folder-asset.atlas/asset-in-folder-asset.png.meta') ).mtime,
            };

            assetdb = new AssetDB({
                cwd: Path.join( __dirname, 'playground' ),
                library: 'library',
            });

            Meta.register(assetdb, '.png', false, Utils.ImageMeta);
            Meta.register(assetdb, '.png', false, Utils.ParticleImageMeta);
            Meta.register(assetdb, '.atlas', true, Utils.AtlasFolderMeta);
            Meta.register(assetdb, '.atlas', false, Utils.AtlasMeta);
            Meta.register(assetdb, '.raw', false, Utils.AssetMeta);
            Meta.register(assetdb, '.asset', false, Utils.ImportAssetMeta);

            assetdb.mount( dest, 'assets', Static.MountType.asset, function ( err ) {
                done();
            });
        });

        afterEach( function ( done ) {
            Del(Path.join( __dirname, 'playground'), { force: true }, done);
        });

        it('should create library file after init', function ( done ) {
            assetdb.init(function ( err ) {
                var meta = Meta.load( assetdb, Path.join(dest,'a-folder.meta') );
                expect(meta).to.be.instanceof(Meta.FolderMeta);

                meta = Meta.load( assetdb, Path.join(dest,'an-asset.atlas.meta') );
                expect(meta).to.be.instanceof(Meta.AssetMeta);
                expect( Fs.existsSync(assetdb._uuidToImportPathNoExt(meta.uuid)+'.atlas') ).to.be.equal(true);

                done();
            });
        });

        it('should touch assets\' meta file if they trigger import', function ( done ) {
            assetdb.init(function ( err ) {
                var p = 'a-folder.meta';
                expect( Fs.statSync(Path.join(dest,p)).mtime.getTime()).to.be.equal( mtimeList[p].getTime() );

                p = 'a-folder/an-asset.asset.meta';
                expect( Fs.statSync(Path.join(dest,p)).mtime.getTime()).to.not.equal( mtimeList[p].getTime() );

                p = 'an-asset.atlas.meta';
                expect( Fs.statSync(Path.join(dest,p)).mtime.getTime()).to.not.equal( mtimeList[p].getTime() );

                p = 'an-folder-asset.atlas.meta';
                expect( Fs.statSync(Path.join(dest,p)).mtime.getTime()).to.not.be.equal( mtimeList[p].getTime() );

                p = 'an-folder-asset.atlas/asset-in-folder-asset.png.meta';
                expect( Fs.statSync(Path.join(dest,p)).mtime.getTime()).to.not.equal( mtimeList[p].getTime() );

                done();
            });
        });
    });

    describe('init-with-meta-and-lib', function () {
        var src = Path.join( __dirname, 'fixtures/init/init-with-meta-and-lib/' );
        var destPlayground = Path.join( __dirname, 'playground/init-with-meta-and-lib/' );

        var dest = Path.join( __dirname, 'playground/init-with-meta-and-lib/assets' );
        var mtimeList = {};

        beforeEach(function ( done ) {
            Fs.copySync( src, destPlayground );

            mtimeList = {
                'a-folder.meta': Fs.statSync( Path.join(dest,'a-folder.meta') ).mtime,
                'a-folder/an-asset.asset.meta': Fs.statSync( Path.join(dest,'a-folder/an-asset.asset.meta') ).mtime,
                'an-asset.atlas.meta': Fs.statSync( Path.join(dest,'an-asset.atlas.meta') ).mtime,
                'an-folder-asset.atlas.meta': Fs.statSync( Path.join(dest,'an-folder-asset.atlas.meta') ).mtime,
                'an-folder-asset.atlas/asset-in-folder-asset.png.meta': Fs.statSync( Path.join(dest,'an-folder-asset.atlas/asset-in-folder-asset.png.meta') ).mtime,
            };

            assetdb = new AssetDB({
                cwd: Path.join( __dirname, 'playground' ),
                library: 'init-with-meta-and-lib/library',
            });

            Meta.register(assetdb, '.png', false, Utils.ImageMeta);
            Meta.register(assetdb, '.png', false, Utils.ParticleImageMeta);
            Meta.register(assetdb, '.atlas', true, Utils.AtlasFolderMeta);
            Meta.register(assetdb, '.atlas', false, Utils.AtlasMeta);
            Meta.register(assetdb, '.raw', false, Utils.AssetMeta);
            Meta.register(assetdb, '.asset', false, Utils.ImportAssetMeta);

            assetdb.mount( dest, 'assets', Static.MountType.asset, function ( err ) {
                done ();
            });
        });

        afterEach( function ( done ) {
            Del(Path.join( __dirname, 'playground'), { force: true }, done);
        });

        // TEMP DISABLE
        // it('should not touch the original meta', function ( done ) {
        //     assetdb.init(function ( err ) {
        //         for ( var p in mtimeList ) {
        //             expect( Fs.statSync(Path.join(dest,p)).mtime.getTime() ).to.be.equal( mtimeList[p].getTime() );
        //         }

        //         done();
        //     });
        // });

        it('should remove unused import files', function ( done ) {
            assetdb.init(function ( err ) {
                var deadbeaf = Path.join(assetdb._importPath, 'de/deadbeaf-dead-beaf-dead-beafdeadbeaf.json' );
                expect( Fs.existsSync(deadbeaf) ).to.be.equal(false);

                done();
            });
        });
    });

    describe('mount type', function () {
        var src = Path.join( __dirname, 'fixtures/init/mount-type' );
        var dest = Path.join( __dirname, 'playground/mount-type' );

        var metaDest = Path.join(dest, 'meta');
        var rawDest = Path.join(dest, 'raw');

        beforeEach(function ( done ) {
            Fs.copySync( src, dest );

            assetdb = new AssetDB({
                cwd: Path.join( __dirname, 'playground' ),
                library: 'library',
            });

            Meta.register(assetdb, '.png', false, Utils.ImageMeta);
            Meta.register(assetdb, '.png', false, Utils.ParticleImageMeta);
            Meta.register(assetdb, '.atlas', true, Utils.AtlasFolderMeta);
            Meta.register(assetdb, '.atlas', false, Utils.AtlasMeta);
            Meta.register(assetdb, '.raw', false, Utils.AssetMeta);
            Meta.register(assetdb, '.asset', false, Utils.ImportAssetMeta);

            Async.series([
                function (next) {
                    assetdb.mount( metaDest, 'assets', Static.MountType.asset, function ( err ) {
                        next ();
                    });
                },
                function (next) {
                    assetdb.mount( rawDest, 'raw', Static.MountType.raw, function ( err ) {
                        next ();
                    });
                },
                function (next) {
                    assetdb.init(next);
                }
            ], function (err) {
                done(err);
            });
        });

        afterEach( function ( done ) {
            Del(Path.join( __dirname, 'playground'), { force: true }, done);
        });

        it('should create meta for meta mount type', function () {
            expect( Fs.existsSync( Path.join(metaDest,'a-folder.meta') ) ).to.be.equal(true);
            expect( Fs.existsSync( Path.join(metaDest,'a-folder/an-asset.asset.meta') ) ).to.be.equal(true);
            expect( Fs.existsSync( Path.join(metaDest,'an-asset.atlas.meta') ) ).to.be.equal(true);
            expect( Fs.existsSync( Path.join(metaDest,'an-folder-asset.atlas.meta') ) ).to.be.equal(true);
            expect( Fs.existsSync( Path.join(metaDest,'an-folder-asset.atlas/asset-in-folder-asset.png.meta') ) ).to.be.equal(true);

            var meta = Meta.load( assetdb, Path.join(metaDest,'a-folder.meta') );
            expect(meta).to.be.instanceof(Meta.FolderMeta);
            expect(meta['asset-type']).to.be.equal('folder');

            meta = Meta.load( assetdb, Path.join(metaDest,'an-asset.atlas.meta') );
            expect(meta).to.be.instanceof(Meta.AssetMeta);
            expect(meta['asset-type']).to.be.equal('atlas');
            expect( Fs.existsSync(assetdb._uuidToImportPathNoExt(meta.uuid)+'.atlas') ).to.be.equal(true);
        });

        it('should not create meta for raw mount type', function () {

            expect( Fs.existsSync( Path.join(rawDest,'a-folder.meta') ) ).to.not.be.equal(true);
            expect( Fs.existsSync( Path.join(rawDest,'a-folder/an-asset.asset.meta') ) ).to.not.be.equal(true);
            expect( Fs.existsSync( Path.join(rawDest,'an-asset.atlas.meta') ) ).to.not.be.equal(true);
            expect( Fs.existsSync( Path.join(rawDest,'an-folder-asset.atlas.meta') ) ).to.not.be.equal(true);
            expect( Fs.existsSync( Path.join(rawDest,'an-folder-asset.atlas/asset-in-folder-asset.png.meta') ) ).to.not.be.equal(true);

        });
    });
});
