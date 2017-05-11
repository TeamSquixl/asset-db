/**
 * @module AssetDB
 * @process core
 */

var Task = require('./tasks');
var Meta = require('./meta');
var Static = require('./static');
var Path = require('fire-path');

module.exports = {
    /**
     * Return uuid by url. if uuid not found, it will return null.
     * @method urlToUuid
     * @param {string} url
     * @return {string}
     */
    urlToUuid: function ( url ) {
        var fspath = this._fspath(url);
        return this.fspathToUuid(fspath);
    },

    /**
     * Return uuid by file path. if uuid not found, it will return null.
     * @method fspathToUuid
     * @param {string} fspath
     * @return {string}
     */
    fspathToUuid: function ( fspath ) {
        return this._path2uuid[fspath];
    },

    /**
     * Return file path by uuid. if file path not found, it will return null.
     * @method uuidToFspath
     * @param {string} uuid
     * @return {string}
     */
    uuidToFspath: function ( uuid ) {
        return this._uuid2path[uuid];
    },

    /**
     * Return url by uuid. if url not found, it will return null.
     * @method uuidToUrl
     * @param {string} uuid
     * @return {string}
     */
    uuidToUrl: function ( uuid ) {
        var fspath = this.uuidToFspath(uuid);
        return this._url(fspath);
    },

    /**
     * Return asset info by uuid.
     * @method assetInfo
     * @param {string} uuid
     * @return {object} - { path, url, type }
     */
    assetInfo: function ( uuid ) {
        var fspath = this.uuidToFspath(uuid);
        return this.assetInfoByPath(fspath);
    },

    /**
     * Return meta instance by uuid.
     * @method loadMeta
     * @param {string} uuid
     * @return {object}
     */
    loadMeta: function ( uuid ) {
        var fspath = this.uuidToFspath(uuid);
        var meta = Meta.load( this, fspath+'.meta' );
        return meta;
    },

    /**
     * Return asset info by file path.
     * @method assetInfoByPath
     * @param {string} fspath
     * @return {object} - { path, url, type }
     */
    assetInfoByPath: function ( fspath ) {
        var url = this._url(fspath);
        var ctor = Meta.findCtor( this, fspath );

        return {
            path: fspath,
            url: url,
            type: ctor['asset-type'],
        };
    },

    /**
     * Return mount info by uuid
     * @method mountInfo
     * @param {string} uuid
     * @return {object} - { path, name, type }
     */
    mountInfo: function ( uuid ) {
        var fspath = this.uuidToFspath(uuid);
        return this.mountInfoByPath(fspath);
    },

    /**
     * Return mount info by path
     * @method mountInfoByPath
     * @param {string} fspath
     * @return {object} - { path, name, type }
     */
    mountInfoByPath: function (fspath) {
        if ( !fspath ) {
            return null;
        }

        for ( var p in this._mounts ) {
            var root = this._mounts[p].path;
            if ( Path.contains( root, fspath ) ) {
                return this._mounts[p];
            }
        }

        return null;
    },

    /**
     * mount a directory to assetdb, and give it a name. if you don't provide a name, it will mount to root.
     * @method mount
     * @param {string} path - file system path
     * @param {string} name - the mount name
     * @param {string} type - mount type. can be `raw` or `asset`
     * @param {function} [cb] - a callback function
     * @example
     * ```js
     * Editor.assetdb.mount('path/to/mount', 'assets', 'asset', function (err) {
     *     // mounted, do something ...
     * });
     * ```
     */
    mount: function ( path, name, type, cb ) {
        this._tasks.push({
            name: 'mount',
            run: Task.mount,
            params: [path, name, type]
        }, cb );
    },

    /**
     * Unmount by name
     * @method unmount
     * @param {string} name - the mount name
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.unmount('assets', function (err) {
     *     // unmounted, do something ...
     * });
     * ```
     */
    unmount: function ( name, cb ) {
        this._tasks.push({
            name: 'unmount',
            run: Task.unmount,
            params: [name],
        }, cb );
    },

    /**
     * Init assetdb, it will scan the mounted directories, and import unimported assets.
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.init(function (err, results) {
     *     // assets that imported during init
     *     results.forEach(function ( result ) {
     *         // result.uuid
     *         // result.parentUuid
     *         // result.url
     *         // result.path
     *         // result.type
     *     });
     * });
     * ```
     */
    init: function ( cb ) {
        this._tasks.push({
            name: 'init',
            run: Task.init,
            params: [],
        }, cb );
    },

    /**
     * Refresh the assets in url, and return the results
     * @param {string} url
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.refresh('assets://foo/bar/', function (err, results) {
     *     // assets that imported during init
     *     results.forEach(function ( result ) {
     *         if ( result.command === 'delete' ) {
     *             // result.uuid
     *             // result.url
     *             // result.path
     *             // result.type
     *         } else if ( result.command === 'change' || result.command === 'create' ) {
     *             // result.uuid
     *             // result.parentUuid
     *             // result.url
     *             // result.path
     *             // result.type
     *         } else if ( result.command === 'uuid-change' ) {
     *             // result.oldUuid
     *             // result.uuid
     *             // result.parentUuid
     *             // result.url
     *             // result.path
     *             // result.type
     *         }
     *     });
     * });
     * ```
     */
    refresh: function ( url, cb ) {
        var fspath = this._fspath(url);

        this._tasks.push({
            name: 'refresh',
            run: Task.refresh,
            params: [fspath],
        }, cb );
    },

    /**
     * deepQuery
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.deepQuery(function ( err, results ) {
     *     results.forEach(function ( result ) {
     *         // result.name
     *         // result.extname
     *         // result.uuid
     *         // result.type
     *         // result.children - the array of children result
     *     });
     * });
     * ```
     */
    deepQuery: function ( cb ) {
        this._tasks.push({
            name: 'deep-query',
            run: Task.deepQuery,
            params: [],
            silent: true,
        }, cb );
    },

    /**
     * queryAssets
     * @param {string} pattern - The url pattern
     * @param {string} type - The asset type
     * @param {function} [cb] - The callback function
     * @example
     * ```js
     * Editor.assetdb.queryAssets( 'assets://**\/*', 'texture', function ( err, results ) {
     *     results.forEach(function ( result ) {
     *         // result.url
     *         // result.path
     *         // result.uuid
     *         // result.type
     *     });
     * });
     * ```
     */
    queryAssets: function ( urlPattern, assetType, cb ) {
        var fspathPattern = this._fspath(urlPattern);

        this._tasks.push({
            name: 'query-assets',
            run: Task.queryAssets,
            params: [fspathPattern, assetType],
            silent: true,
        }, cb );
    },

    /**
     * queryMetas
     * @param {string} pattern - The url pattern
     * @param {string} type - The asset type
     * @param {function} [cb] - The callback function
     * @example
     * ```js
     * Editor.assetdb.queryAssets( 'assets://**\/*', 'texture', function ( err, results ) {
     *     results.forEach(function ( meta ) {
     *         // the meta instance
     *     });
     * });
     * ```
     */
    queryMetas: function ( urlPattern, assetType, cb ) {
        var fspathPattern = this._fspath(urlPattern);

        this._tasks.push({
            name: 'query-metas',
            run: Task.queryMetas,
            params: [fspathPattern, assetType],
            silent: true,
        }, cb );
    },

    /**
     * move
     * @param {string} srcUrl
     * @param {string} destUrl
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.move( 'assets://foo/foobar.png', 'assets://bar/foobar.png', function ( err, results ) {
     *     results.forEach(function ( result ) {
     *         // result.srcMountType
     *         // result.destMountType
     *         // result.srcPath
     *         // result.destPath
     *         // result.uuid
     *         // result.parentUuid
     *     });
     * });
     * ```
     */
    move: function ( srcUrl, destUrl, cb) {

        var srcFspath = this._fspath(srcUrl);
        var destFspath = this._fspath(destUrl);

        this._tasks.push({
            name: 'move',
            run: Task.move,
            params: [srcFspath, destFspath]
        }, cb);
    },

    /**
     * delete
     * @param {string} url
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.delete( 'assets://foo/bar.png', function ( err, results ) {
     *     results.forEach(function ( result ) {
     *         // result.srcMountType
     *         // result.destMountType
     *         // result.srcPath
     *         // result.destPath
     *         // result.uuid
     *         // result.parentUuid
     *     });
     * });
     * ```
     */
    delete: function (url, cb) {
        var fspath = this._fspath(url);
        var mountType = this.mountInfoByPath(fspath).type;

        if (mountType === Static.MountType.asset) {
            this._tasks.push({
                name: 'delete',
                run: Task.delete,
                params: [fspath],
            }, cb );
        }
        else if (mountType === Static.MountType.raw) {
            this._tasks.push({
                name: 'raw-delete',
                run: Task.rawDelete,
                params: [fspath],
            }, cb );
        }
        else {
            if (cb) cb( new Error('Wrong mountType : ' + mountType) );
        }
    },

    /**
     * Create asset at url with data
     * @param {string} url
     * @param {string} data
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.create( 'assets://foo/bar.js', data, function ( err, results ) {
     *     results.forEach(function ( result ) {
     *         // result.uuid
     *         // result.parentUuid
     *         // result.url
     *         // result.path
     *         // result.type
     *     });
     * });
     * ```
     */
    create: function ( url, data, cb ) {
        var fspath = this._fspath(url);

        this._tasks.push({
            name: 'create',
            run: Task.create,
            params: [fspath, data],
        }, cb );
    },

    /**
     * Save data to the exists asset at url
     * @param {string} url
     * @param {string} data
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.save( 'assets://foo/bar.js', data, function ( err, meta ) {
     *     // do something
     * });
     * ```
     */
    save: function ( url, data, cb ) {
        var fspath = this._fspath(url);

        this._tasks.push({
            name: 'save',
            run: Task.save,
            params: [fspath, data],
        }, cb );
    },

    /**
     * Import raw files to url
     * @param {array} rawfiles
     * @param {string} url
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.import( ['/User/user/foo.js', '/User/user/bar.js'], 'assets://foobar', function ( err, results ) {
     *     results.forEach(function ( result ) {
     *         // result.uuid
     *         // result.parentUuid
     *         // result.url
     *         // result.path
     *         // result.type
     *     });
     * });
     * ```
     */
    import: function ( rawfiles, url, cb ) {
        var fspath = this._fspath(url);
        var mountType = this.mountInfoByPath(fspath).type;

        if (mountType === Static.MountType.asset) {
            this._tasks.push({
                name: 'import',
                run: Task.import,
                params: [rawfiles, fspath],
            }, cb );
        }
        else if (mountType === Static.MountType.raw) {
            this._tasks.push({
                name: 'raw-import',
                run: Task.rawImport,
                params: [rawfiles, fspath],
            }, cb );
        }
        else {
            if (cb) cb( new Error('Wrong mountType : ' + mountType) );
        }
    },

    /**
     * Overwrite the meta by loading it through uuid
     * @param {string} uuid
     * @param {string} jsonString
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.saveMeta( uuid, jsonString, function ( err, meta ) {
     *     // do something
     * });
     * ```
     */
    saveMeta: function( uuid, jsonString, cb ) {
        this._tasks.push({
            name: 'save-meta',
            run: Task.saveMeta,
            params: [uuid, jsonString],
        }, cb );
    },

    /**
     * Clear imports
     * @param {string} url
     * @param {function} [cb]
     * @example
     * ```js
     * Editor.assetdb.clearImports( 'assets://foo/bar.js', function ( err, results ) {
     *     results.forEach(function ( result ) {
     *         // result.uuid
     *         // result.url
     *         // result.path
     *         // result.type
     *     });
     * });
     * ```
     */
    clearImports: function (url, cb) {
        var fspath = this._fspath(url);

        this._tasks.push({
            name: 'clear-imports',
            run: Task.clearImports,
            params: [fspath, null],
        }, cb );
    },

    /**
     * Register meta type
     * @param {string} extname
     * @param {boolean} folder - Whether it's a folder type
     * @param {object} metaCtor
     * @example
     * ```js
     * Editor.assetdb.register( '.png', false, PngMeta );
     * ```
     */
    register: function ( extname, folder, metaCtor ) {
        Meta.register( this, extname, folder, metaCtor );
    },

    /**
     * Unregister meta type
     * @param {object} metaCtor
     * @example
     * ```js
     * Editor.assetdb.unregister( PngMeta );
     * ```
     */
    unregister: function ( metaCtor ) {
        Meta.unregister( this, metaCtor );
    },
};
