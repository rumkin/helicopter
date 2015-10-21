'use strict';

var _ = require('underscore');
var helpers = require('./helpers.js');
var co = require('co');

exports.socketIo = function (config, events) {
    return function (server) {
        var io = require('socket.io')(server);
        var eventsMap = config.get('events');

        io.on('connection', function (socket) {
            function bind(map, prefix) {
                if (! prefix) {
                    prefix = [];
                }

                _.keys(map).forEach((name) => {
                    var value = map[name];
                    if (_.isObject(value)) {
                        bind(value, prefix.concat(name));
                        return;
                    }

                    var path = (value === true)
                        ? prefix.concat(name)
                        : value;

                    var method = helpers.findByPath(events, path);
                    var context = helpers.findByPath(events, path.slice(0, -1));

                    if (typeof method !== 'function') {
                        throw new Error('Invalid event binding: ' + path.join('.'));
                    }

                    if (method.constructor.name === 'GeneratorFunction') {
                        socket.on(path.join('.'), function (params, cb) {
                            co(function * () {
                                return method.call(context, params);
                            }).then(function (data) {
                                cb({
                                    error: null,
                                    data: data
                                });
                            }).catch(function (error) {
                                cb({
                                    error: error.stack,
                                    data: null
                                });
                            });
                        });
                    } else {
                        socket.on(path.join('.'), function (params, cb) {
                            method.call(context, params, function (error, data) {
                                var result = {
                                    error: null,
                                    data: null
                                };

                                if (error) {
                                    result.error = error.stack;
                                } else {
                                    result.data = data;
                                }

                                cb(result);
                            });
                        });
                    }
                });
            }

            bind(eventsMap.bind);
        });
    };
};
