var Fs = require('fire-fs');
var Path = require('fire-path');
var Del = require('del');
var Async = require('async');
var AssetDB = require('../index');
var Static = require('../lib/static');

//
describe('Test mount', function () {
    var assetdb;
    before(function ( done ) {
        assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });

        done();
    });

    after( function ( done ) {
        Async.each(['foo', 'bar'], function ( name, done ) {
            assetdb.unmount( name, done );
        }, function () {
            Del( Path.join( __dirname, 'playground' ), done );
        });
    });

    it('should report error when mount path not exists', function ( done ) {
        assetdb.mount( 'path/not/exists', 'foo', Static.MountType.asset, function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount path is a file', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'basic.js'), 'foo', Static.MountType.asset, function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount target have `/`, `\\` or `.`', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/mount-01' ), 'foo/bar', Static.MountType.asset, function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should mount success to foo for fixtures/mount/mount-01', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/mount/mount-01' ), 'foo', Static.MountType.asset, function ( err ) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('should report error when mount to foo again', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/mount/mount-02' ), 'foo', Static.MountType.asset, function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount path already used', function ( done ) {
        Async.series([
            //
            function ( next ) {
                assetdb.mount( Path.join( __dirname, 'fixtures/mount/mount-01' ), 'bar', Static.MountType.asset, function ( err ) {
                    console.log(err);
                    expect(err).to.be.instanceof(Error);
                    next();
                });
            },

            //
            function ( next ) {
                assetdb.mount( Path.join( __dirname, 'fixtures/mount/mount-01/' ), 'bar', Static.MountType.asset, function ( err ) {
                    console.log(err);
                    expect(err).to.be.instanceof(Error);
                    next();
                });
            },
        ], function () {
            done();
        })
    });

    it('should report error when you mount a path that its parent already used', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/mount/mount-01/foo' ), 'bar', Static.MountType.asset, function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when you mount a path that its children already used', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures' ), 'bar', Static.MountType.asset, function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should mount success to bar for fixtures/mount/mount-02', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/mount/mount-02' ), 'bar', Static.MountType.asset, function ( err ) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('should report error when mount type is wrong', function (done) {
        assetdb.mount( Path.join( __dirname, 'fixtures/mount/mount-03' ), 'foo/bar', 'wrong-mount-type', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should mount success when mount type is raw', function (done) {
        assetdb.mount( Path.join( __dirname, 'fixtures/mount/mount-03' ), 'foo/bar', Static.MountType.raw, function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });
});

describe('Test unmount', function () {
    var assetdb;

    before(function ( done ) {
        assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });
        done();
    });

    after( function ( done ) {
        Del( Path.join( __dirname, 'playground' ), done );
    });

    it('should report error when you unmount a not exists node', function ( done ) {
        assetdb.unmount('foobar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });
});
