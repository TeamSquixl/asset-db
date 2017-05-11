var Path = require('fire-path');
var Fs = require('fire-fs');
var Chalk = require('chalk');
var Util = require('util');
var Del = require('del');

var chalk_success = Chalk.green;
var chalk_warn = Chalk.yellow;
var chalk_error = Chalk.red;
var chalk_info = Chalk.cyan;

var AssetDB = {};
module.exports = AssetDB;

var ED = global.Editor;
var _log, _success, _failed, _info, _warn, _error;

// log
if ( ED && ED.log ) {
    _log = ED.log;
} else {
    _log = console.log;
}

// success
if ( ED && ED.log ) {
    _success = ED.success;
} else {
    _success = function () {
        var text = Util.format.apply(Util, arguments);
        console.log( chalk_success(text) );
    };
}

// failed
if ( ED && ED.log ) {
    _failed = ED.failed;
} else {
    _failed = function () {
        var text = Util.format.apply(Util, arguments);
        console.log( chalk_error(text) );
    };
}

// info
if ( ED && ED.info ) {
    _info = ED.info;
} else {
    _info = function () {
        var text = Util.format.apply(Util, arguments);
        console.info( chalk_info(text) );
    };
}

// warn
if ( ED && ED.warn ) {
    _warn = ED.warn;
} else {
    _warn = function () {
        var text = Util.format.apply(Util, arguments);

        var e = new Error('dummy');
        var lines = e.stack.split('\n');
        text = text + '\n' + lines.splice(2).join('\n');

        console.warn( chalk_warn(text) );
    };
}

// error
if ( ED && ED.error ) {
    _error = ED.error;
} else {
    _error = function () {
        var text = Util.format.apply(Util, arguments);

        var e = new Error('dummy');
        var lines = e.stack.split('\n');
        text = text + '\n' + lines.splice(2).join('\n');

        console.error( chalk_error(text) );
    };
}

if ( ED && ED.throw ) {
    AssetDB.throw = ED.throw;
}
else {
    AssetDB.throw = function ( type ) {
        var args = [].slice.call( arguments, 1 );
        var text = Util.format.apply(Util, args);
        if ( type === 'type' ) {
            throw new TypeError(text);
        }
        throw new Error(text);
    };
}

AssetDB.log = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _log.apply( this, args );
        return;
    }
    _log.apply( this, arguments );
};

AssetDB.success = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _success.apply( this, args );
        return;
    }
    _success.apply( this, arguments );
};

AssetDB.failed = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _failed.apply( this, args );
        return;
    }
    _failed.apply( this, arguments );
};

AssetDB.info = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _info.apply( this, args );
        return;
    }
    _info.apply( this, arguments );
};

AssetDB.warn = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _warn.apply( this, args );
        return;
    }
    _warn.apply( this, arguments );
};

AssetDB.error = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _error.apply( this, args );
        return;
    }
    _error.apply( this, arguments );
};

AssetDB.mkdirForAsset = function ( uuid ) {
    if ( !uuid || uuid === '' ) {
        this.throw( 'normal', 'Invalid uuid' );
    }

    // get importPath and create it if not exists
    var folder = uuid.substring(0,2);
    var dest = Path.join(this._importPath,folder);

    if ( !Fs.existsSync ( dest ) ) {
        Fs.mkdirSync(dest);
    }

    return dest;
};

// DELME
// AssetDB.mkdirForRawfile = function ( uuid ) {
//     var dest = this.mkdirForAsset(uuid);

//     dest = Path.join(dest, uuid);

//     if ( !Fs.existsSync ( dest ) ) {
//         Fs.mkdirSync(dest);
//     }

//     return dest;
// };

// var _reg = /[\\/]/;

AssetDB.copyAssetToLibrary = function ( uuid, fspath ) {
    var dest = this._uuidToImportPathNoExt(uuid) + Path.extname(fspath);

    this.mkdirForAsset(uuid);
    Fs.copySync( fspath, dest );

    return dest;
};

AssetDB.saveAssetToLibrary = function ( uuid, asset, ext ) {
    var data;
    if ( typeof asset === 'string' || asset instanceof Buffer ) {
        data = asset;
    }
    else {
        if ( asset.serialize ) {
            data = asset.serialize();
        }
        if ( !data ) {
            data = JSON.stringify( asset, null, 2 );
        }
    }

    ext = ext ? ext : '.json';
    var dest = this.mkdirForAsset(uuid);
    dest = Path.join(dest, uuid+ext);
    Fs.writeFileSync( dest, data );

    return dest;
};

var _updateMtimeDebounceID = null;
AssetDB.updateMtime = function ( uuid ) {
    if ( uuid ) {
        var assetpath = this._uuid2path[uuid];
        if ( Fs.existsSync(assetpath) ) {
            var assetMtime = Fs.statSync(assetpath).mtime.getTime();
            var metaMtime = Fs.statSync(assetpath+'.meta').mtime.getTime();

            //
            this._uuid2mtime[uuid] = {
                asset: assetMtime,
                meta: metaMtime,
            };
        } else {
            delete this._uuid2mtime[uuid];
        }
    }

    // debounce write for 50ms
    if ( _updateMtimeDebounceID ) {
        clearTimeout(_updateMtimeDebounceID);
        _updateMtimeDebounceID = null;
    }
    _updateMtimeDebounceID = setTimeout(function () {
        var json = JSON.stringify(this._uuid2mtime, null, 2);
        // NOTE: it is possible before we wrote, library has been deleted.
        if ( Fs.existsSync( this.library ) ) {
            Fs.writeFileSync(this._uuid2mtimePath, json, 'utf8');
        }
    }.bind(this), 50);
};

/**
 * Create thumbnail by uuid
 * @param {string} uuid
 * @param {number} size
 * @param {object} imageOrFn
 * @param {function} [cb]
 */
AssetDB.createThumbnail = function ( uuid, size, imageOrFn, cb ) {
    var Lwip = require('lwip');
    var Async = require('async');

    if ( typeof imageOrFn === 'function' )
        cb = imageOrFn;

    var assetdb = this;
    Async.waterfall([
        function ( next ) {
            if ( typeof imageOrFn !== 'function' ) {
                next ( null, imageOrFn );
                return;
            }

            var fspath = assetdb.uuidToFspath(uuid);
            Lwip.open( fspath, next );
        },

        function ( lwipImage, next ) {
            lwipImage.contain( size, size, {r: 255, g: 255, b: 255, a: 0} , 'grid', next );
        },

        function ( lwipImage, next ) {
            var dest = assetdb.mkdirForAsset(uuid);
            lwipImage.writeFile( Path.join(dest, uuid + '.thumb.png'), next );
        },

    ], function ( err ) {
        if ( cb ) cb ( err );
    });
};

/**
 * Delete thumbnail by uuid
 * @param {string} uuid
 * @param {function} [cb]
 */
// AssetDB.deleteThumbnail = function ( uuid, cb ) {
//     var folder = uuid.substring(0,2);
//     folder = Path.join(this._thumbnailPath, folder);
//     var path = Path.join(folder, uuid + '.png');

//     if ( !Fs.existsSync(path) ) {
//         if (cb) cb();
//         return;
//     }

//     Async.series([
//         // delete thumbnail
//         function (next) {
//             console.log('delete thumbnail : ', path);
//             Del(path, {force: true}, next);
//         },
//         // if folder is empty then delete folder
//         function (next) {
//             var pattern = Path.join(folder, '**/*');
//             Globby( pattern, function ( err, paths ) {

//                 if (paths.length === 0) {
//                     Del(folder, {force: true}, next);
//                 }
//                 else {
//                     next();
//                 }
//             });
//         }
//     ], function (err) {
//         if (cb) cb(err);
//     });
// };
