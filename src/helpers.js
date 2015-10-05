'use strict';

var util = require('util');

exports.isPlainObject = isPlainObject;
exports.hasOwnMethod = hasOwnMethod;
exports.extendDeep = merge;
exports.merge = merge;
exports.extend = extend;
exports.cloneDeep = cloneDeep;
exports.defaults = defaults;
exports.findByPath = findByPath;
exports.replace = replace;
exports.inspect = inspect;
exports.toCamelCase = toCamelCase;

function isObject(target) {
    return target !== null && typeof target === 'object';
}

function isPlainObject(object){
    return !! object && typeof object === 'object' && object.constructor === Object;
}

function hasOwnMethod(object, method) {
    return !! object && object.hasOwnProperty(method) && typeof object[method] === 'function';
}

/**
 * Deeply merge one object's proeprties to another. Only plain objects could
 * be merged.
 *
 * @param  {*} target Target value. If not an Object then new object will be returned.
 * @param  {*} source Properties source. Ignored if not an Object.
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
 * Append the source properties to the target object.
 *
 * @param  {*} target Target value. If not an Object then new object will be returned.
 * @param  {*} source Properties source. Ignored if not an Object.
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
 * @param  {{}} target Object.
 * @return {{}}} New object cloned from target.
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
 * @param  {{}} target Target object.
 * @param  {{}} source Source object.
 * @return {{}}        Target object.
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
 * @param  {{}} target Object to extract value.
 * @param  {string|array} path   String path or array of segments separated with dot or slash.
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
 * Replace text placeholders.
 *
 * @param  {string} message Template string.
 * @param  {object|*} values  Values dictionary or value to placehold.
 * @return {string}         Result string.
 */
function replace(message, values) {
    var args = Array.prototype.slice.call(arguments, 1);
    return message.replace(/\$(\d+)/g, function (match, n) {
        return args[n];
    }).replace(/\$\{([a-zA-Z0-9$_]+)\}/g, function (match, name) {
        return values[name] || '';
    });
}

/**
 * Inspect arguments with colorization.
 */
function inspect() {
    var args = Array.prototype.slice.call(arguments).map(function(arg){
        return util.inspect(arg, {colors:true});
    });
    console.log.apply(console, args);
}

function toCamelCase(str) {
    return str.replace(/\W(.)/g, (m, v) => v.toUpperCase());
}
