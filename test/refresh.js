var Path = require('fire-path');
var Fs = require('fire-fs');
var Del = require('del');

//
var Utils = require('./utils');

describe('Test refresh', function () {
    Utils.init('refresh/assets');

    it('should reimport asset if delete its meta outside when asset is a file', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://an-asset.atlas';
        var fspath  = assetdb._fspath(url);
        var metapath = fspath + '.meta';
        var uuid = assetdb.fspathToUuid( fspath );
        var mtime = assetdb._uuid2mtime[uuid];

        Del.sync(metapath, {force: true});

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 1 );
            expect( results[0].command ).to.equal( 'change' );
            expect( Fs.existsSync(metapath) ).to.be.true;
            expect( assetdb.fspathToUuid(fspath) ).to.equal( uuid );
            expect( assetdb._uuid2mtime[uuid] ).to.not.equal( mtime );

            done();
        });
    });

    it('should reimport asset if delete its meta outside when asset is a folder', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a-folder';
        var fspath  = assetdb._fspath( url );
        var fspath2 = assetdb._fspath( 'assets://a-folder/an-asset.asset' );
        var metapath = fspath + '.meta';

        var uuid = assetdb.fspathToUuid( fspath );
        var uuid2 = assetdb.fspathToUuid( fspath2 );

        var mtime = assetdb._uuid2mtime[uuid2];

        Del.sync(metapath, {force: true});

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 2 );
            results.forEach( function (result) {
                expect( result.command ).to.equal( 'change' );
            })
            expect( Fs.existsSync(metapath) ).to.be.true;
            expect( assetdb.fspathToUuid(fspath) ).to.equal( uuid );
            expect( assetdb.fspathToUuid(fspath2) ).to.equal( uuid2 );
            expect( assetdb._uuid2mtime[uuid] ).to.not.equal( mtime );

            done();
        });
    });

    it('should reimport asset if modify its meta but not change uuid outside ', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://an-asset.atlas';
        var fspath  = assetdb._fspath(url);
        var metapath = fspath + '.meta';
        var uuid = assetdb.fspathToUuid( fspath );
        var mtime = assetdb._uuid2mtime[uuid];

        var metaObj = Fs.readJsonSync( metapath );
        metaObj.test = true;
        Fs.writeJsonSync( metapath, metaObj );

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 1 );
            expect( results[0].command ).to.equal( 'change' );
            expect( Fs.existsSync(metapath) ).to.be.true;
            expect( assetdb.fspathToUuid(fspath) ).to.equal( uuid );
            expect( assetdb._uuid2mtime[uuid] ).to.not.equal( mtime );

            done();
        });
    });

    it('should reimport asset use new uuid if modify its meta uuid outside ', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://an-asset.atlas';
        var fspath  = assetdb._fspath(url);
        var metapath = fspath + '.meta';
        var uuid = assetdb.fspathToUuid( fspath );
        var mtime = assetdb._uuid2mtime[uuid];

        var newUuid = '1111-2222-3333-4444';
        var metaObj = Fs.readJsonSync( metapath );
        metaObj.uuid = newUuid;
        Fs.writeJsonSync( metapath, metaObj );

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 1 );
            expect( results[0].command ).to.equal( 'uuid-change' );
            expect( results[0].oldUuid ).to.equal( uuid );
            expect( results[0].uuid ).to.equal( newUuid );
            expect( Fs.existsSync(metapath) ).to.be.true;

            expect( assetdb.uuidToFspath(uuid) ).to.be.undefined;
            expect( assetdb._uuid2mtime[uuid] ).to.be.undefined;

            expect( assetdb.fspathToUuid(fspath) ).to.equal( newUuid );
            expect( assetdb._uuid2mtime[newUuid] ).to.not.equal( mtime );

            done();
        });
    });

    it('should reimport asset use new uuid if modify its meta uuid outside when asset is a folder', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a-folder';
        var fspath  = assetdb._fspath(url);
        var metapath = fspath + '.meta';
        var uuid = assetdb.fspathToUuid( fspath );

        var newUuid = '1111-2222-3333-4444';
        var metaObj = Fs.readJsonSync( metapath );
        metaObj.uuid = newUuid;
        Fs.writeJsonSync( metapath, metaObj );

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 2 );
            expect( results[0].command ).to.equal( 'uuid-change' );
            expect( results[0].oldUuid ).to.equal( uuid );
            expect( results[0].uuid ).to.equal( newUuid );
            expect( Fs.existsSync(metapath) ).to.be.true;

            expect( assetdb.uuidToFspath(uuid) ).to.be.undefined;
            expect( assetdb._uuid2mtime[uuid] ).to.be.undefined;

            expect( assetdb.fspathToUuid(fspath) ).to.equal( newUuid );

            done();
        });
    });

    it('should delete imports, meta, uuid if delete an asset outside ', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://an-asset.atlas';
        var fspath  = assetdb._fspath(url);
        var metapath = fspath + '.meta';
        var uuid = assetdb.fspathToUuid( fspath );
        var importPath = assetdb._fspathToImportPathNoExt(fspath);

        Del.sync( fspath, {force: true});

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 1 );
            expect( results[0].command ).to.equal( 'delete' );
            expect( Fs.existsSync(metapath) ).to.be.false;
            expect( Fs.existsSync(importPath) ).to.be.false;

            expect( assetdb.uuidToFspath(uuid) ).to.be.undefined;
            expect( assetdb._uuid2mtime[uuid] ).to.be.undefined;

            done();
        });
    });

    it('should delete imports, meta, uuid if delete an asset outside when asset is a folder ', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a-folder';
        var folderPath  = assetdb._fspath(url);
        var filePath = assetdb._fspath('assets://a-folder/an-asset.asset');
        var folderMetaPath = folderPath + '.meta';
        var fileMetaPath = filePath + '.meta';

        Del.sync( folderPath, {force: true});

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 2 );
            expect( results[0].command ).to.equal( 'delete' );
            expect( results[1].command ).to.equal( 'delete' );

            expect( Fs.existsSync(folderMetaPath) ).to.be.false;
            expect( assetdb.fspathToUuid(folderPath) ).to.be.undefined;

            expect( Fs.existsSync(fileMetaPath) ).to.be.false;
            expect( assetdb.fspathToUuid(filePath) ).to.be.undefined;

            done();
        });
    });

    it('should reimport asset if modify its content outside ', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://an-asset.atlas';
        var fspath  = assetdb._fspath(url);
        var metapath = fspath + '.meta';
        var uuid = assetdb.fspathToUuid( fspath );
        var mtime = assetdb._uuid2mtime[uuid];

        Fs.writeJsonSync( fspath, {test: 1111} );

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 1 );
            expect( results[0].command ).to.equal( 'change' );
            expect( Fs.existsSync(metapath) ).to.be.true;
            expect( assetdb.fspathToUuid(fspath) ).to.equal( uuid );
            expect( assetdb._uuid2mtime[uuid] ).to.not.equal( mtime );

            done();
        });
    });

    it('should reimport asset if do nothing but refresh it when asset is a file', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://an-asset.atlas';
        var fspath  = assetdb._fspath(url);
        var metapath = fspath + '.meta';
        var uuid = assetdb.fspathToUuid( fspath );
        var mtime = assetdb._uuid2mtime[uuid];

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 1 );
            expect( results[0].command ).to.equal( 'change' );
            expect( Fs.existsSync(metapath) ).to.be.true;
            expect( assetdb.fspathToUuid(fspath) ).to.equal( uuid );
            expect( assetdb._uuid2mtime[uuid] ).to.not.equal( mtime );

            done();
        });
    });


    it('should reimport asset if do nothing but refresh it when asset is a folder ', function ( done ) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a-folder';
        var folderPath  = assetdb._fspath(url);
        var filePath = assetdb._fspath('assets://a-folder/an-asset.asset');
        var folderMetaPath = folderPath + '.meta';
        var fileMetaPath = filePath + '.meta';
        var folderUuid = assetdb.fspathToUuid( folderPath );
        var fileUuid = assetdb.fspathToUuid( filePath );
        var mtime = assetdb._uuid2mtime[fileUuid];

        assetdb.refresh( url, function ( err, results ) {

            expect( results.length ).to.equal( 2 );
            expect( results[0].command ).to.equal( 'change' );
            expect( results[1].command ).to.equal( 'change' );

            expect( Fs.existsSync(folderMetaPath) ).to.be.true;
            expect( assetdb.fspathToUuid(folderPath) ).to.equal( folderUuid );

            expect( Fs.existsSync(fileMetaPath) ).to.be.true;
            expect( assetdb.fspathToUuid(filePath) ).to.equal( fileUuid );
            expect( assetdb._uuid2mtime[fileUuid] ).to.not.equal( mtime );

            done();
        });
    });

    it('should import asset if it is added to db from outside ', function ( done ) {
        var assetdb = Utils.assetdb();

        var srcPath = Path.join(__dirname, 'fixtures/refresh/assets-to-import/a.atlas');
        var destPath = Utils.assetpath('b.atlas');

        Fs.copySync( srcPath, destPath );

        assetdb.refresh( 'assets://b.atlas', function ( err, results ) {

            var uuid = assetdb.fspathToUuid( destPath );
            var metapath = destPath + '.meta';
            var importPath = assetdb._fspathToImportPathNoExt(destPath) + '.atlas';

            expect( results.length ).to.equal( 1 );
            expect( results[0].command ).to.equal( 'create' );
            expect( Fs.existsSync(metapath) ).to.be.true;

            expect( uuid ).to.not.be.undefined;
            expect( assetdb._uuid2mtime[uuid] ).to.not.be.undefined;
            expect( Fs.existsSync(importPath) ).to.be.true;

            done();
        });
    });

    it('should import asset if it is added to db from outside ', function ( done ) {
        var assetdb = Utils.assetdb();

        var srcPath = Path.join(__dirname, 'fixtures/refresh/assets-to-import/b-folder');
        var destPath = Utils.assetpath('b-folder');

        Fs.copySync( srcPath, destPath );

        assetdb.refresh( 'assets://b-folder', function ( err, results ) {


            expect( results.length ).to.equal( 2 );
            expect( results[0].command ).to.equal( 'create' );
            expect( results[1].command ).to.equal( 'create' );

            var uuid = assetdb.fspathToUuid( destPath );
            expect( Fs.existsSync(destPath + '.meta') ).to.be.true;
            expect( uuid ).to.not.be.undefined;

            var path = Path.join( destPath, 'an-asset.asset');
            var importPath = assetdb._fspathToImportPathNoExt(path) + '.asset';
            uuid = assetdb.fspathToUuid( path );

            expect( Fs.existsSync(path + '.meta') ).to.be.true;
            expect( uuid ).to.not.be.undefined;
            expect( assetdb._uuid2mtime[uuid] ).to.not.be.undefined;
            expect( Fs.existsSync(importPath) ).to.be.true;

            done();
        });
    });

});

