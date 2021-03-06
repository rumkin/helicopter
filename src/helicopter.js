'use strict';

var Singular = require('singular');
var core = require('./core.js');
var server = require('./server.js');
var router = require('./router.js');
var socketIo = require('./socket-io.js');
var awaits = require('./awaits.js');
var Error = require('./error.js');
var glob = require('glob');
var path = require('path');
var _ = require('underscore');

module.exports = HelicopterApp;

/**
 * Helicopter application constructor.
 *
 * @param {object} config Configuration object.
 * @extends Singular
 */
function HelicopterApp(config) {
    Singular.call(this, config);

    this.module(core);
    this.module(server);
    this.module(router);
    this.module(socketIo);
    this.module(awaits);
}

Object.setPrototypeOf(HelicopterApp.prototype, Singular.prototype);

/**
 * Helicopter error constructor.
 * @type {HelicopterError}
 */
HelicopterApp.Error = Error;

/**
 * Create new sub class of Helicopter application.
 *
 * @param  {string} name  Constructor name.
 * @param  {object} proto Prototype object. If prototype has property
 *                        `constructor` then it's prototype will be extended
 *                        and returned.
 * @return {HyphenApp}   New HyphenApp extended constructor.
 */
HelicopterApp.extend = function (name, proto) {
    if (arguments.length < 2) {
        proto = name;
        name = null;
    }

    var Super = this;
    var ctor;
    if (proto.hasOwnProperty('constructor')) {
        ctor = proto.constructor;
    } else {
        ctor = function () {
            Super.apply(this, arguments);
        };
    }

    if (name) {
        Object.defineProperty(ctor, 'name', {
            value: name
        });
    }

    Object.setPrototypeOf(ctor.prototype, this.prototype);

    Object.getOwnPropertyNames(proto).forEach(function (name) {
        if (['constructor', 'prototype'].indexOf(name) > -1) {
            return;
        }

        ctor.prototype[name] = proto[name];
    });

    Object.getOwnPropertyNames(this).forEach((name) => {
        if (['name', 'constructor', 'length', 'caller', 'arguments', 'prototype'].indexOf(name) > -1) {
            return;
        }
        ctor[name] = this[name];
    });

    return ctor;
};

/**
 * Initialize application.
 */
HelicopterApp.prototype.init = function () {
    this.loadConfig();
};

/**
 * Commands factory.
 *
 * @return {object} Return object with commands for cli application.
 */
HelicopterApp.prototype.commands = function () {
    return {};
};

/**
 * Get configuration with dir name. If dir name not specified then
 * `config.dir + '/config'` will be used.
 *
 * @param  {string} [dir] Configuration directory name.
 * @return {object}     Configuration object.
 */
HelicopterApp.prototype.getConfig = function (dir) {
    dir = path.resolve(this.config.dir, dir || 'config');
    var files = glob.sync('*.js', {cwd: dir});

    return files.reduce(function (result, file) {
        return _.extend(result, require(path.join(dir, file)));
    }, {});
};

/**
 * Load configuration from directory and append it to existed. This method
 * loads environment configuration if `env` option is specified in config.
 *
 * @param  {string?} [dir] Configuration directory.
 */
HelicopterApp.prototype.loadConfig = function (dir) {
    dir = dir || 'config';
    var env = this.config.env;

    _.extend(this.config, this.getConfig(dir));
    if (env) {
        _.extend(this.config, this.getConfig(path.join(dir, env)));
    }
};

/**
 * Initialize and returns service by name.
 *
 * @param  {string} name Service name.
 * @return {object}      Service instance.
 */
HelicopterApp.prototype.service = function (name) {
    return this.get(name + 'Service');
};
