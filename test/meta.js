var Fs = require('fire-fs');
var Path = require('fire-path');

var Meta = require('../lib/meta');
var Utils = require('./utils');

describe('Meta.findCtor', function () {
    Utils.init('meta');

    it('should get ParticleImageMeta', function ( done ) {
        var assetdb = Utils.assetdb();
        var ctor = Meta.findCtor(assetdb, assetdb._fspath('assets://some-assets/particles/smoke.png'));
        expect(ctor).to.equal(Utils.ParticleImageMeta);
        done();
    });

    it('should get ImageMeta', function ( done ) {
        var assetdb = Utils.assetdb();
        var ctor = Meta.findCtor(assetdb, assetdb._fspath('assets://some-assets/spineboy/spineboy.png'));
        expect(ctor).to.equal(Utils.ImageMeta);
        done();
    });

    it('should get AssetMeta', function ( done ) {
        var assetdb = Utils.assetdb();
        var ctor = Meta.findCtor(assetdb, assetdb._fspath('assets://a-folder/an-asset.asset'));
        expect(ctor).to.equal(Utils.ImportAssetMeta);
        done();
    });

    it('should get FolderMeta', function ( done ) {
        var assetdb = Utils.assetdb();
        var ctor = Meta.findCtor(assetdb, assetdb._fspath('assets://a-folder'));
        expect(ctor).to.equal(Utils.FolderMeta);
        done();
    });

    it('should get AtlasMeta', function ( done ) {
        var assetdb = Utils.assetdb();
        var ctor = Meta.findCtor(assetdb, assetdb._fspath('assets://atlas-asset.atlas'));
        expect(ctor).to.equal(Utils.AtlasMeta);
        done();
    });

    it('should get AtlasFolderMeta', function ( done ) {
        var assetdb = Utils.assetdb();
        var ctor = Meta.findCtor(assetdb, assetdb._fspath('assets://atlas-folder.atlas'));
        expect(ctor).to.equal(Utils.AtlasFolderMeta);
        done();
    });
});
