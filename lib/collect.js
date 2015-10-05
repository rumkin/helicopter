var glob = require('glob');
var path = require('path');
var fs = require('fs');

module.exports = collect;

/**
 * Collect files by mask from specified directory, split path into parts
 * filename, basename, extension, basedir and root directorys and pass through
 * callback method which should produce items list: {key:<string>,value:<*>}.
 *
 * @param  {string}   mask     File mask, like `*.js`
 * @param  {string}   dir      Root directory.
 * @param  {Function} callback Callback called on each found item. Should
 *                             return object {key:string,value:*}.
 * @return {object}            Collected values.
 */
function collect(mask, dir, callback) {
    return glob.sync(mask, {cwd: dir})
        .map(function(file){
            var ext = path.extname(file);
            var basename = path.basename(file, ext);
            var dirname = path.dirname(file);

            return callback(file, basename, ext, dirname, dir);
        })
        .filter(function(value){
            return !!value;
        })
        .reduce(function(result, item){
            if (Array.isArray(item)) {
                item.forEach(function(item){
                    result[item.key] = item.value;
                });
            } else {
                result[item.key] = item.value;
            }
            return result;
        }, {});
}
