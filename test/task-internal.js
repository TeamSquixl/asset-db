var Path = require('fire-path');
var Fs = require('fire-fs');
var Del = require('del');
var Async = require('async');

//
var Utils = require('./utils');
var AssetDB = require('../index');
var Meta = require('../lib/meta');
var Tasks = require('../lib/tasks');
var Static = require('../lib/static');

// ----------------

//
describe('Tasks._scan', function () {
    var assetdb;

    before(function ( done ) {
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

        done();
    });

    after( function ( done ) {
        Del(Path.join( __dirname, 'playground'), { force: true }, done);
    });

    it('should return the results we expect when scan single file', function ( done ) {
        var dest = Path.join( __dirname, 'fixtures/task-internal/scan/a-folder/an-asset.asset' );
        Tasks._scan( assetdb, dest, function ( err, results ) {
            expect(results).to.be.deep.equal([
                dest
            ]);
            done();
        });
    });

    it('should return the results we expect when scan directory', function ( done ) {
        var dest = Path.join( __dirname, 'fixtures/task-internal/scan/some-scripts' );
        Tasks._scan( assetdb, dest, function ( err, results ) {
            expect(results).to.be.deep.equal([
                '',
                'foobar',
                'foobar.js',
                'foobar/foo-01.js',
                'foobar/foo-02.js',
                'foobar/foo-03.js',
            ].map(function (path) {
                return Path.join( dest, path );
            }));
            done();
        });
    });
});

describe('Tasks._scan with unused meta', function () {
    var assetdb;
    var src = Path.join( __dirname, 'fixtures/task-internal/scan/assets-with-unused-meta' );
    var dest = Path.join( __dirname, 'playground/assets-with-unused-meta' );

    before(function ( done ) {
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

        done();
    });

    after( function ( done ) {
        Del(Path.join( __dirname, 'playground'), { force: true }, done);
    });

    beforeEach(function (done) {
        Fs.copySync( src, dest );
        done();
    });

    afterEach(function (done) {
        Del(dest, { force: true }, done);
    });

    it('should not list unsued meta files in the results', function ( done ) {
        Tasks._scan( assetdb, dest, { 'remove-unused-meta': false }, function ( err, results ) {
            expect(results).to.not.include.members([
                'unused-folder-meta.meta',
                'animation/unused-file-meta.asset.meta'
            ].map(function (path) {
                return Path.join( dest, path );
            }));
            // expect(Fs.existsSync( Path.join( dest, 'unused-folder-meta.meta'))).to.be.true;
            // expect(Fs.existsSync( Path.join( dest, 'animation/unused-file-meta.asset.meta'))).to.be.true;

            done();
        });
    });

    it('should remove unused meta files during scan', function ( done ) {
        Tasks._scan( assetdb, dest, { 'remove-unused-meta': true }, function ( err, results ) {
            expect(Fs.existsSync( Path.join( dest, 'unused-folder-meta.meta'))).to.be.equal(false);
            expect(Fs.existsSync( Path.join( dest, 'animation/unused-file-meta.asset.meta'))).to.be.equal(false);
            done();
        });
    });
});

describe('Tasks._initMetas', function () {
    var assetdb;
    var src = Path.join( __dirname, 'fixtures/task-internal/init-meta' );
    var dest = Path.join( __dirname, 'playground/init-meta' );

    before(function ( done ) {
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

        done();
    });

    after( function ( done ) {
        Del(Path.join( __dirname, 'playground'), { force: true }, done);
    });

    beforeEach(function (done) {
        Fs.copySync( src, dest );
        done();
    });

    afterEach(function (done) {
        Del(dest, { force: true }, done);
    });

    it('should create meta if meta not found', function ( done ) {
        var mtime = Fs.statSync( Path.join( dest, 'an-asset-with-meta.js.meta' ) ).mtime.getTime();

        Tasks._initMetas( assetdb, dest, null, function ( err ) {
            expect(Fs.existsSync(Path.join(dest,'a-folder.meta'))).to.be.equal(true);
            expect(Fs.existsSync(Path.join(dest,'a-folder/an-asset.asset.meta'))).to.be.equal(true);

            var mtime2 = Fs.statSync(Path.join(dest,'an-asset-with-meta.js.meta')).mtime.getTime();
            expect(mtime).to.be.equal(mtime2);

            done();
        });
    });

    it('should removed unused meta file', function ( done ) {
        Tasks._initMetas( assetdb, dest, null, function ( err ) {
            expect(Fs.existsSync(Path.join(dest,'unused-folder-meta.meta'))).to.be.equal(false);
            expect(Fs.existsSync(Path.join(dest,'unused-file-meta.asset.meta'))).to.be.equal(false);

            done();
        });
    });

    it('should not add meta to results if meta failed to load', function ( done ) {
        Tasks._initMetas( assetdb, dest, null, function ( err, results ) {
            var paths = results.map( function ( item ) {
                return item.assetpath;
            });

            expect(paths).to.have.members([
                dest, // NOTE: because we don't mount here, so isRoot will return false in _initMetas
                Path.join( dest, 'a-folder' ),
                Path.join( dest, 'a-folder/an-asset.asset' ),
                Path.join( dest, 'a-folder-with-meta' ),
                Path.join( dest, 'a-folder-with-meta/empty.asset' ),
                Path.join( dest, 'an-asset-with-meta.js' ),
                Path.join( dest, 'an-asset.atlas' ),
                Path.join( dest, 'an-folder-asset.atlas' ),
                Path.join( dest, 'an-folder-asset.atlas/asset-in-folder-asset.png' ),
                Path.join( dest, 'meta-has-error.js' ),
            ]);

            done();
        });
    });
});

describe('Tasks._checkIfReimport', function () {
    var assetdb;
    var src = Path.join( __dirname, 'fixtures/task-internal/check-if-reimport/' );
    var dest = Path.join( __dirname, 'playground/check-if-reimport' );

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
            function ( next ) {
                assetdb.mount( dest, 'assets', Static.MountType.asset, next );
            },

            function ( next ) {
                assetdb.init( next );
            },

            function ( next ) {
                var meta = Meta.load( assetdb, Path.join(dest, 'an-asset-not-in-library.js.meta') );

                Del([
                    assetdb._uuidToImportPathNoExt( meta.uuid ),
                    assetdb._uuidToImportPathNoExt( meta.uuid ) + '.*',
                    Path.join(dest, 'an-asset-without-meta.js.meta'),
                    Path.join(dest, 'an-folder-asset.atlas/asset-in-folder-asset-without-meta.png.meta'),
                ], next );
            },

            function ( next ) {
                var meta = Meta.load( assetdb, Path.join(dest, 'an-asset-changes-outside.js.meta') );
                var now = new Date();

                assetdb._uuid2mtime[meta.uuid] = {
                    asset: now.getTime(),
                    meta: now.getTime(),
                };

                assetdb.updateMtime();
                next();
            },
        ], function () {
            setTimeout( done, 100 );
        });

    });

    afterEach( function ( done ) {
        Del(Path.join( __dirname, 'playground' ), { force: true }, done);
    });

    it('should get reimport results', function ( done ) {
        var tests = [
            {
                path: Path.join( dest, 'a-folder-with-meta' ),
                result: false,
            },
            {
                path: Path.join( dest, 'a-folder-with-meta/an-asset-with-meta.js' ),
                result: false,
            },
            {
                path: Path.join( dest, 'an-asset-changes-outside.js' ),
                result: true,
            },
            // TEMP DISABLE
            // {
            //     path: Path.join( dest, 'an-asset-not-in-library.js' ),
            //     result: true,
            // },
            {
                path: Path.join( dest, 'an-asset-without-meta.js' ),
                result: true,
            },
            // // NOTE: in windows assets in folder changes will make folder changes
            // {
            //     path: Path.join( dest, 'an-folder-asset.atlas' ),
            //     result: Editor.isWin32 ?  true : false,
            // },
            {
                path: Path.join( dest, 'an-folder-asset.atlas/asset-in-folder-asset.png' ),
                result: false,
            },
            {
                path: Path.join( dest, 'an-folder-asset.atlas/asset-in-folder-asset-without-meta.png' ),
                result: true,
            },
            {
                path: Path.join( dest, 'meta-has-error.js' ),
                result: false, // NOTE: this is bacause it will be repaired in AssetDB.init
            },
        ];

        Async.each( tests, function ( test, done ) {
            Tasks._checkIfReimport( assetdb, test.path, function ( err, reimport ) {
                console.log('check %s', test.path );
                expect( test.result ).to.be.equal(reimport);
                done();
            });
        }, function () {
            done();
        });
    });
});
