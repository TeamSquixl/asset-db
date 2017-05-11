var Path = require('fire-path');
var Fs = require('fire-fs');
var Del = require('del');
var Globby = require('globby');
var Sinon = require('sinon');

var Utils = require('./utils');

describe('Test clearImports', function () {
    //
    function DeleteMeta () {
        Utils.ImportAssetMeta.call(this);
    }
    Utils.extend(DeleteMeta, Utils.ImportAssetMeta);
    DeleteMeta.prototype.delete = function (assetdb, fspath, cb) {
        if (cb) cb();
    };
    spy = Sinon.spy(DeleteMeta.prototype, 'delete');

    //
    Utils.init('clear-imports', function ( assetdb ) {
        assetdb.register('.asset', false, DeleteMeta);
    });

    afterEach( function ( done ) {
        spy.reset();
        done();
    });

    it('should clear imports if url is file', function (done) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a.asset';
        var path = assetdb._fspath( url );
        var uuid = assetdb.urlToUuid( url );

        var importPath = assetdb._fspathToImportPathNoExt(path);

        Del(path, function () {
            assetdb.clearImports( url, function (err, results) {
                assert( !err );

                assert( spy.called );

                expect( assetdb.fspathToUuid(path) ).to.be.undefined;
                expect( assetdb._uuid2mtime[uuid] ).to.be.undefined;

                expect( Fs.existsSync(importPath) ).to.not.be.true;

                done();
            });
        });
    });

    it('should clear folder and subitems imports if url is folder', function (done) {
        var assetdb = Utils.assetdb();

        var url = 'assets://a-folder';
        var path = assetdb._fspath( url );

        var pattern = [path, Path.join(path, '**/*'), '!'+Path.join(path, '**/*.meta')];

        Globby( pattern, function ( err, paths ) {
            var infos = paths.map( function (path) {
                path = Path.normalize( path );

                var uuid = assetdb.fspathToUuid( path );
                var importPath = assetdb._fspathToImportPathNoExt(path);
                var importFolder = Path.join(Path.dirname(importPath), Path.basenameNoExt(importPath));

                return {
                    path: path,
                    uuid: assetdb.fspathToUuid( path ),
                    importPath: assetdb._fspathToImportPathNoExt(path),
                    importFolder: Path.join(Path.dirname(importPath), Path.basenameNoExt(importPath))
                };
            });

            Del(path, function () {
                assetdb.clearImports( url, function (err, results) {
                    assert( !err );

                    expect(spy.callCount).to.equal( 2 );

                    infos.forEach( function (info) {
                        expect( assetdb.fspathToUuid(info.path) ).to.be.undefined;
                        expect( assetdb._uuid2mtime[info.uuid] ).to.be.undefined;

                        expect( Fs.existsSync(info.importPath) ).to.not.be.true;
                        expect( Fs.existsSync(info.importFolder) ).to.not.be.true;
                    });

                    done();
                });
            });
        });

    });

});
