var Path = require('fire-path');
var Fs = require('fire-fs');

//
var Utils = require('./utils');

describe('Test deepQuery', function () {
    Utils.init('query');

    it('should query results', function ( done ) {
        var assetdb = Utils.assetdb();

        assetdb.deepQuery(function ( err, results ) {
            expect(results[0].name).to.be.equal('assets');
            expect(results[0].children[0].name).to.be.equal('a-folder');
            expect(results[0].children[0].type).to.be.equal('folder');
            // console.log( JSON.stringify(results, null, 2));

            done();
        });
    });
});


describe('Tests queryAssets', function () {
    Utils.init('query');

    it('should query folder assets', function ( done ) {
        var assetdb = Utils.assetdb();

        assetdb.queryAssets( 'assets://**/*', 'atlas', function ( err, results ) {
            expect(results.length).to.be.equal(2);
            expect(results[0].url).to.be.equal('assets://an-asset.atlas');
            expect(results[1].url).to.be.equal('assets://an-folder-asset.atlas');

            done();
        });
    });

    it('should query folders', function ( done ) {
        var assetdb = Utils.assetdb();

        assetdb.queryAssets( 'assets://**/*', 'folder', function ( err, results ) {
            expect(results.length).to.be.equal(2);
            expect(results[0].url).to.be.equal('assets://a-folder');
            expect(results[1].url).to.be.equal('assets://a-folder-with-meta');

            done();
        });
    });
});

describe('Test queryMetas', function () {
    Utils.init('query');

    it('should query folder assets', function ( done ) {
        var assetdb = Utils.assetdb();

        assetdb.queryAssets( 'assets://**/*', 'atlas', function ( err, results ) {
            expect(results.length).to.be.equal(2);
            expect(results[0].type).to.be.equal('atlas');
            expect(results[1].type).to.be.equal('atlas');

            done();
        });
    });

    it('should query folders', function ( done ) {
        var assetdb = Utils.assetdb();

        assetdb.queryAssets( 'assets://**/*', 'folder', function ( err, results ) {
            expect(results.length).to.be.equal(2);
            expect(results[0].type).to.be.equal('folder');
            expect(results[1].type).to.be.equal('folder');

            done();
        });
    });
});
