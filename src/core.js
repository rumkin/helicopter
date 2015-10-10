'use strict';

var path = require('path');
var collect = require('../lib/collect');
var include = require('../lib/include');
var helpers = require('./helpers.js');

exports.CoreError = require('./error');

exports.config = function($$) {
    return {
        // Set config value
        set(path, value) {
            var parts = path.trim().split('.');
            var part;
            var config = $$.config;
            while (parts.length > 1) {
                part = parts.shift();
                if (part in config === false || !helpers.isPlainObject(config[part])) {
                    config[part] = {};
                }
                config = config[part];
            }
            config[parts[0]] = value;
            return this;
        },
        // Add values to path
        add(path, value) {
            if (typeof value !== 'object') {
                throw new Error('Value should be an object');
            }

            var parts = path.trim().split('.');
            var part;
            var config = $$.config;
            while (parts.length > 0) {
                part = parts.shift();
                if (part in config === false || !helpers.isPlainObject(config[part])) {
                    config[part] = {};
                }
                config = config[part];
            }

            helpers.merge(config, value);
            return this;
        },
        defaults(path, values) {
            if (typeof values !== 'object') {
                throw new Error('Default values should be an object');
            }

            var item = this.get(path);
            if (typeof item !== 'object') {
                item = {};
            }

            Object.getOwnPropertyNames(values).forEach(function(name){
                if (item.hasOwnProperty(name)) {
                    return;
                }
                item[name] = values[name];
            });

            this.set(path, item);
            return item;
        },
        // Get config value, or alternative value
        get(path, alt) {
            var parts = path.trim().split('.');
            var part, result;
            var config = $$.config;
            while (parts.length > 1) {
                part = parts.shift();
                if (part in config && typeof config[part] === 'object') {
                    config = config[part];
                } else {
                    return;
                }
            }

            result = config[parts[0]];
            if (alt && typeof result === 'undefined') {
                result = alt;
            }
            return result;
        },
        all() {
            return $$.config;
        }
    };
};

// Common include scope

exports.includeScope = function(config){
    return include.createScope({
        config : config
    });
};

// Application controllers

exports.controllersOptions = function(config){
    return config.defaults('core.controllers', {
        dir : path.join(config.get('dir'), config.get('apiDir', 'api'), 'controllers')
    });
};

exports.controllers = function(controllersOptions, includeScope) {
    return collect('*-controller.js', controllersOptions.dir, function(file, basename, ext, dir, root){
        var controller = include(root + '/' + file, includeScope);
        var name = basename
            .replace(/-controller$/, '')
            .replace(/\W(.)/g, (m, v) => v.toUpperCase());
        includeScope[basename + 'Controller'] = controller;
        return {
           key: name,
           value: controller
        };
    });
};

exports.eventsOptions = function(config){
    return config.defaults('core.events', {
        dir : path.join(config.get('dir'), config.get('apiDir', 'api'), 'events')
    });
};

exports.events = function(eventsOptions, includeScope) {
    return collect('*-events.js', eventsOptions.dir, function(file, basename, ext, dir, root){
        var event = include(root + '/' + file, includeScope);
        var name = basename
            .replace(/-events$/, '')
            .replace(/\W(.)/g, (m, v) => v.toUpperCase());

        includeScope[name + 'Events'] = event;

        return {
            key: name,
            value: event
        };
    });
};

// Application services

exports.servicesOptions = function(config){
    return config.defaults('core.services', {
        dir : path.join(config.get('dir'), config.get('apiDir', 'api'), 'services')
    });
};

exports.services = function($$, servicesOptions, includeScope) {
    var names = [];
    var services = collect('*-service.js', servicesOptions.dir, function(file, basename, ext, dir, root) {
        var moduleExports = include(root + '/' + file, includeScope);

        if (typeof moduleExports !== 'function') {
            return;
        }

        var moduleName = basename.replace(/(^|\W)(.)/g, (m,p,v) => v.toUpperCase());

        names.push(moduleName);
        $$.factory(moduleName, moduleExports);

        return {key: moduleName, value : moduleExports};
    });

    names.forEach(function(name){

        Object.defineProperty(includeScope, name, {
            get : function() {
                return $$.get(name);
            }
        });
    });

    return services;
};

exports.modelsOptions = function(config){
    return config.defaults('core.models', {
        dir : path.join(config.get('dir'), config.get('apiDir', 'api'), 'models')
    });
};

exports.models = function(modelsOptions, includeScope) {
    var models = {};

    collect('*.js', modelsOptions.dir, function(file, basename, ext, dir, root){
        var moduleModels = include(root + '/' + file, includeScope);
        var name, value;

        for (name in moduleModels) {
            if (! moduleModels.hasOwnProperty(name)) {
                continue;
            }

            value = moduleModels[name];

            if (value && (typeof value === 'function' || typeof value === 'object')) {
                models[name] = value;
                includeScope[name] = value;
            }
        }
    });

    return models;
};

exports.responsesOptions = function(config) {
    return config.defaults('core.responses', {
        dir : path.join(config.get('dir'), config.get('apiDir', 'api'), 'responces')
    });
};

exports.responses = function(config, responsesOptions, includeScope) {
    var options = config.get('core.responses');
    var dir = path.resolve(config.get('dir'), options.dir);
    return collect('*.js', dir, function(file, basename){
        return {
            key : basename,
            value : include(dir + '/' + file, includeScope)
        };
    });
};

// Policies options

exports.policiesOptions = function(config) {
    return config.defaults('core.policies', {
        dir : path.join(config.get('dir'), config.get('apiDir', 'api'), 'policies')
    });
};

// Policies loader
exports.policies = function(policiesOptions, config, includeScope) {
    var dir = path.resolve(config.get('dir'), policiesOptions.dir);
    return collect('*.js', dir, function(file, basename){
        return {
            key : basename,
            value : include(dir + '/' + file, includeScope)
        };
    });
};

// Autoload modules options

exports.modulesOptions = function(config) {
    return config.defaults('core.modules', {
        dir : path.join(config.get('dir'), 'modules')
    });
};

// Autoload modules

exports.modules = function($$, modulesOptions, config) {
    var dir = path.resolve(config.get('dir'), modulesOptions.dir);
    return collect('*.js', dir, function(file, basename){
        var module = require(dir + '/' + file);
        $$.module(module);
        return {
            key : basename,
            value : module
        };
    });
};

// Self initialization

exports.init = function($$, config) {
    // Initialize dependent modules. Uses config option `init`.
    return config.get('init', []).map(function(name){
        $$.get(name);
        return name;
    });
};
