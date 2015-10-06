var Singular = require('Singular');
var core = require('./core.js');
var server = require('./server.js');
var router = require('./router.js');
var socketIo = require('./socket-io.js');
var Error = require('./error.js');
var inherits = require('util').inherits;
var glob = require('glob');
var path = require('path');
var _ = require('underscore');

module.exports = HelicopterApp;

function HelicopterApp(config) {
    Singular.call(this, config);

    this.module(core);
    this.module(server);
    this.module(router);
    this.module(socketIo);
}

inherits(HelicopterApp, Singular);

HelicopterApp.Error = Error;

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

    inherits(ctor, this);

    Object.getOwnPropertyNames(proto).forEach(function (name) {
        if (['constructor'].indexOf(name) > -1) {
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

HelicopterApp.prototype.init = function () {
    this.loadConfig();
};

HelicopterApp.prototype.commands = function () {
    return {};
};

HelicopterApp.prototype.getConfig = function (dir) {
    dir = path.resolve(this.config.dir, dir || 'config');
    var files = glob.sync('*.js', {cwd: dir});

    return files.reduce(function (result, file) {
        return _.extend(result, require(path.join(dir, file)));
    }, {});
};

HelicopterApp.prototype.loadConfig = function (dir) {
    dir = dir || 'config';
    var env = this.config.env;

    _.extend(this.config, this.getConfig(dir));
    if (env) {
        _.extend(this.config, this.getConfig(path.join(dir, env)));
    }
};

HelicopterApp.prototype.service = function (name) {
    return this.get(name + 'Service');
};
