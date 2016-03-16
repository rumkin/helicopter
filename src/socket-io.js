'use strict';

var _ = require('underscore');
var helpers = require('./helpers.js');
var co = require('co');
var HelicopterError = require('./error.js');

exports.socketIo = function ($$, config, events) {
    const DEBUG = config.get('debug');

    /**
     * Socket on error calback generator.
     *
     * @param  {Function} done Socket response callback.
     * @return {Function(Error)} Function to produce socket error response.
     */
    function socketOnError(done) {
        var onError = config.get('socketIo.onError');

        if (onError) {
            onError = $$.get(onError);
        } else {
            onError = function(error) {
                if (error instanceof HelicopterError === false) {
                    if (DEBUG) {
                        error = {
                            code: 'UNKNOWN_ERROR',
                            message: error.message,
                            stack: error.stack
                        };
                    } else {
                        error = {
                            code: 'UNKNOWN_ERROR',
                            message: 'Server error'
                        };
                    }
                }

                return error;
            };
        }

        return function(error) {
            done({
                error: onError(error),
                data: null
            });
        };
    }

    /**
     * Socket on data calback generator.
     *
     * @param  {Function} done Socket response callback.
     * @return {Function(*)} Function to produce socket data response.
     */
    function socketOnData(done) {
        var onData = config.get('socketIo.onData');

        if (onData) {
            onData = $$.get(onData);
        } else {
            onData = function(data) {
                return data;
            };
        }

        return function (data) {
            done({
                error: null,
                data: onData(data)
            });
        };
    }

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

                    var fn;

                    if (method.constructor.name === 'GeneratorFunction') {
                        fn = function (params) {
                            return co(function * () {
                                return yield method.call(context, params, socket);
                            });
                        };
                    } else {
                        fn = helpers.promisify(method, context);
                    }

                    socket.on(path.join('.'), function (params, cb) {
                        var onError = socketOnError(cb);
                        var onData = socketOnData(cb);

                        fn(params, socket).then(onData).catch(onError);
                    });
                });
            }

            function addListener(event, pointer, socket) {
                var method = helpers.findMethodBinding(events, pointer);

                if (typeof method !== 'function') {
                    throw new Error('Method pointer "' + pointer + '" is invalid');
                }

                socket.on(event, method);
            }

            bind(eventsMap.bind);

            // Emit on connect events (could throw)
            var onConnect = eventsMap.onConnect;
            if (onConnect) {
                if (! Array.isArray(onConnect)) {
                    onConnect = [onConnect];
                }

                onConnect.forEach(function (pointer) {
                    var method = helpers.findMethodBinding(events, pointer);
                    if (typeof method !== 'function') {
                        throw new Error('Method pointer "' + pointer + '" is invalid');
                    }

                    method(socket);
                });
            }

            // Bind disconnect events
            if (eventsMap.onDisconnect) {
                if (Array.isArray(eventsMap.onDisconnect)) {
                    eventsMap.onDisconnect.forEach(function (pointer) {
                        addListener('disconnect', pointer, socket);
                    });
                } else {
                    addListener('disconnect', eventsMap.onDisconnect, socket);
                }
            }

            // Bind socket error listeners
            if (eventsMap.onError) {
                if (Array.isArray(eventsMap.onError)) {
                    eventsMap.onError.forEach(function (pointer) {
                        addListener('disconnect', pointer, socket);
                    });
                } else {
                    addListener('disconnect', eventsMap.onError, socket);
                }
            }
        });
    };
};
