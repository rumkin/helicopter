var util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
 * Singular cache factory
 * @returns {Function}
 */
exports.cacheFactory = function() {
    return function() {
        return new Cache();
    };
};

exports.Cache = Cache;

/**
 * Cache object stores values and trigger events on changes
 * @constructor
 */
function Cache() {
    EventEmitter.call(this);
    this._cache = {};
}

util.inherits(Cache, EventEmitter);

/**
 * Get item with id
 * @param {string} id Cache item id
 * @returns {*}
 */
Cache.prototype.get = function(id) {
    return this._cache[id];
};

/**
 * Put data with id to cache
 * @param {string} id Cache item id
 * @param {*} data Cache item value
 * @returns {Cache}
 */
Cache.prototype.put = function(id, data) {
    this._cache[id] = data;
    this.emit('put', id, data);
    return this;
};

/**
 * Check if item exists in cache
 * @param {string} id Cache item id
 * @returns {boolean}
 */
Cache.prototype.has = function(id) {
    return this._cache.hasOwnProperty(id);
};

/**
 * Remove item from cache
 * @param {string} id Cache item id
 * @returns {Cache}
 */
Cache.prototype.remove = function (id){
    delete this._cache[id];
    this.emit('remove', id, data);
    return this;
};

/**
 * Drop cache storage
 * @returns {Cache}
 */
Cache.prototype.drop = function() {
    var _cache = this._cache;
    Object.getOwnPropertyNames(_cache).forEach(function(name){
       delete _cache[name];
    });
    this.emit('drop');
    return this;
};

/**
 * Map through cache objects
 * @param map
 * @returns {Array}
 */
Cache.prototype.map = function(map) {
    var _cache = this._cache;

    return Object.getOwnPropertyNames(_cache).map(function(name){
        return map(_cache[name], name);
    });
};
