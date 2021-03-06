'use strict';

var util = require('util');

exports.isObject = isObject;
exports.isPlainObject = isPlainObject;
exports.isError = isError;
exports.hasOwnMethod = hasOwnMethod;
exports.extendDeep = merge;
exports.merge = merge;
exports.extend = extend;
exports.cloneDeep = cloneDeep;
exports.defaults = defaults;
exports.findByPath = findByPath;
exports.findMethodBinding = findMethodBinding;
exports.replace = replace;
exports.inspect = inspect;
exports.toCamelCase = toCamelCase;
exports.toUpperCamelCase = toUpperCamelCase;
exports.promisify = promisify;

/**
 * Check if value is an Object (not a null)
 *
 * @param  {*}  target Any value to check.
 * @return {boolean}        True if value is object and not a null.
 */
function isObject(target) {
    return target !== null && typeof target === 'object';
}

/**
 * Check if value is object and it's prototype constructor is Object.
 *
 * @param  {*}  object Any value to check.
 * @return {boolean}        Return true if target.constructor is Object.
 */
function isPlainObject(target){
    return !! target && typeof target === 'object' && target.constructor === Object;
}

/**
 * Check if object has own method.
 *
 * @param  {object}  object Target object.
 * @param  {string}  method Method name.
 * @return {boolean}        Return true if object has own property with name
*                           `method` and this property is a function.
 */
function hasOwnMethod(object, method) {
    return !! object && object.hasOwnProperty(method) && typeof object[method] === 'function';
}

/**
 * Check if value is an Error or a error-like object. It checks is value
 * an object and if constructor name ends with `Error`.
 *
 * @param  {*}  object Value to check.
 * @return {Boolean}        Returns true if object prototype inherits Error or
 * if constructor name contains error.
 */
function isError(object) {
    if (! isObject(object)) {
        return false;
    }

    if (object instanceof Error) {
        return true;
    }

    return object.constructor.name.slice(-5) === 'Error';
}

/**
 * Deeply merge one object's proeprties to another. Only plain objects could
 * be merged. All sources should be an objects. Other types are ignored. If
 * target is not an object then new object will be returned.
 *
 * @param  {object} target Target value. If not an Object then new object will be returned.
 * @param  {...object} source Properties source. Ignored if not an Object.
 * @return {object}        Target object merged with source.
 */
function merge(target, source) {
    if (!target || typeof target !== 'object') {
        return target;
    }

    Array.prototype.slice.call(arguments, 1).forEach(function(source){
        if (typeof source !== 'object') {
            return;
        }

        Object.getOwnPropertyNames(source).forEach(function(name){
            var tVal, sVal;
            sVal = source[name];
            if (target.hasOwnProperty(name)) {
                tVal = target[name];
                if (isPlainObject(tVal) && isPlainObject(sVal)) {
                    target[name] = merge(tVal, sVal);
                } else {
                    target[name] = sVal;
                }
            } else {
                if (isPlainObject(sVal)) {
                    target[name] = merge({}, sVal);
                } else {
                    target[name] = sVal;
                }
            }
        });
    });
    return target;
}

/**
 * Append the source properties to the target object. All sources should be an
 * objects. Other types are ignored. If target is not an object then new object
 * will be returned.
 *
 * @param  {object} target Target value. If not an Object then new object will be returned.
 * @param  {...object} source Properties source. Ignored if not an Object.
 * @return {object}        Target object extended with source properties.
 */
function extend(target, source) {
    var sources = Array.prototype.slice.call(arguments, 1);
    if (! isObject(target)) {
        target = {};
    }

    sources.forEach(function(source){
        if (! isObject(source)) {
            return;
        }

        Object.getOwnPropertyNames(source).forEach(function(name){
            target[name] = source[name];
        });
    });

    return target;
}

/**
 * Clone object deep. The same as merge but with calling method `clone`.
 *
 * @param  {object target Object.
 * @return {object} New object cloned from target.
 */
function cloneDeep(target) {
    if (!target || typeof target !== 'object') {
        return target;
    }

    var result = {};

    if (Array.isArray(target)) {
        result = target.map(cloneDeep);
    } else {
        Object.getOwnPropertyNames(target).forEach(function(name){
            var value;
            value = target[name];

            if (isObject(value)) {
                if (isPlainObject(value) || Array.isArray(value)) {
                    result[name] = cloneDeep(value);
                } else if (hasOwnMethod(value, 'clone')){
                    result[name] = value.clone();
                } else {
                    // Objects without clone method just copied by ref
                    result[name] = value;
                }
            } else {
                result[name] = value;
            }
        });
    }

    return result;
}

/**
 * Add values from source to target object.
 *
 * @param  {object} target Target object.
 * @param  {object} source Source object.
 * @return {object}        Target object.
 */
function defaults(target, source) {
    if (! isObject(target)) {
        target = {};
    }

    Object.getOwnPropertyNames(source).forEach(function(name){
        if (target.hasOwnProperty(name)) {
            return;
        }

        target[name] = source[name];
    });

    return target;
}

/**
 * Get value from object using dot separated path.
 *
 * @param  {object} target Object to extract value.
 * @param  {string|string[]} path   String path or array of segments separated with dot or slash.
 * @param  {string} Separator   Path segments separator.
 * @return {*} Return object value or undefined if value not found.
 */
function findByPath(target, path, separator) {
    if (! isObject(target)) {
        return undefined;
    }

    var segments;

    if (! Array.isArray(path)) {
        separator = separator || '.';
        segments = path.split(separator);
    } else {
        segments = path.slice();
    }

    while (segments.length > 1) {
        let segment = segments.shift();
        if (segment in target === false || ! isObject(target[segment])) {
            return undefined;
        }

        target = target[segment];
    }

    return target[segments[0]];
}

/**
 * Bind method with scope.
 *
 * @param  {Object} target Target object.
 * @param  {string|string[]} path   Method path.
 * @param  {*...} arg   Binding arguments.
 * @return {function|null} Return null if method not found or property is not a function.
 */
function findMethodBinding(target, path) {
    if (typeof path === 'string') {
        path = path.split('.');
    }

    var context;
    if (path.length > 1) {
        context = findByPath(target, path.slice(0, -1));
        if (! isObject(context)) {
            return;
        }
    } else {
        context = target;
    }

    var method = context[path[path.length - 1]];

    if (typeof method !== 'function') {
        return;
    }

    var args = Array.prototype.slice.call(arguments, 2);
    args.unshift(context);

    return method.bind.apply(method, args);
}

/**
 * Replace text placeholders. Replace method understand `$n` as arguments numbers
 * and `${name}` as the first argument object properties.
 *
 * @param  {string} message Template string.
 * @param  {...*} values  Values dictionary or value to placehold.
 * @return {string}         Result string.
 */
function replace(message, values) {
    var args = Array.prototype.slice.call(arguments, 1);
    return message.replace(/\$(\d+)/g, function (match, n) {
        return args[n];
    }).replace(/\$\{([a-zA-Z$_][a-zA-Z0-9$_.]*)\}/g, function (match, name) {
        return findByPath(values, name, '.') || '';
    });
}

/**
 * Inspect arguments with colorization.
 *
 * @param {...*} arg Any value to dump into console as colorized JS value.
 */
function inspect(arg) {
    var args = Array.prototype.slice.call(arguments).map(function(arg){
        return util.inspect(arg, {colors:true});
    });
    console.log.apply(console, args);
}

/**
 * Convert string to camel case.
 *
 * @param  {string} str Initial string delimited with non word chars.
 * @return {string}     camelCased string.
 */
function toCamelCase(str) {
    return str.toLowerCase().replace(/\W+(.)/g, (m, v) => v.toUpperCase());
}

/**
 * Convert string to upper camel case.
 *
 * @param  {string} str Initial string delimited with non word chars.
 * @return {string}     CamelCased string.
 */
function toUpperCamelCase(str) {
    return str.charAt(0).toUpperCase() + toCamelCase(str.slice(1));
}

/**
 * Promisify callback method.
 *
 * @param  {function} method Method to wrap into Promise.
 * @param  {Object=} ctx    This context. If not set then will be used wrapper's this.
 * @return {function}        Return function with promise interface.
 */
function promisify(method, ctx) {
    if (typeof method !== 'function') {
        throw new Error('Method should be a function');
    }

    var hasCtx = (typeof ctx !== 'undefined');

    return function () {
        var args = Array.prototype.slice.call(arguments);

        if (! hasCtx) {
            ctx = this;
        }

        return new Promise((resolve, reject) => {
            var result = method.apply(ctx||null, args.concat(function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }));

            if (result instanceof Promise) {
                result.then(resolve, reject);
            }
        });
    };
}
