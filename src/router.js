'use strict';

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var _ = require('underscore');
var CoreError = require('./error');
var express = require('express');
var co = require('co');
var helpers = require('./helpers.js');
var Stream = require('stream');

exports.routesHttp = function(config, policies, routeTypes) {
    return function(server, options) {
        server.use(function (req, res, next) {
            if (! res.hasOwnProperty('sendError')) {
                res.sendError = function (error) {
                    this.status(500);
                    if (config.get('debug')) {
                        if (error instanceof Error) {
                            error = error.stack;
                        }
                        this.end(error);
                    } else {
                        this.end('Server Error');
                    }
                };
            }

            if (! res.hasOwnProperty('sendData')) {
                res.sendData = res.json;
            }

            next();
        });

        bindRoutes(server, config.get('routes', {}), options);

        function bindRoutes(router, routes, options) {
            var route, subRouter, url, action, cb, type, queue, policy;

            routesLoop : for (route in routes) {
                if (!routes.hasOwnProperty(route)) {
                    continue;
                }

                let segments = route.split(' ');
                let method;

                if (segments.length > 1) {
                    method = segments[0];
                    if (method === '*') {
                        method = 'ALL';
                    }
                    url = segments[1];
                } else {
                    method = 'ALL';
                    url = segments[0];
                }

                method = method.toLowerCase();
                if (typeof router[method] !== 'function') {
                    throw new CoreError('ROUTER_BAD_METHOD', {route: route, method: method});
                }

                action = routes[route];
                queue = [url];

                if (action.hasOwnProperty('schema')) {
                    bindSchema(action.schema);
                }

                policy = action.policy;

                function bindPolicy(policy) {
                    if (typeof policies[policy] !== 'function') {
                        throw new Error('Unknown policy ' + policy);
                    }
                    queue.push(policies[policy]);
                }

                if (policy) {
                    if (Array.isArray(policy)) {
                        policy.forEach(bindPolicy);
                    } else {
                        bindPolicy(policy);
                    }
                }

                if (action.hasOwnProperty('routes')) {
                    if (method !== 'all') {
                        throw new CoreError('ROUTER_BAD_METHOD', {
                            route: route,
                            method: method
                        });
                    }

                    subRouter = new express.Router();
                    bindRoutes(subRouter, action.routes, options);
                    queue.push(subRouter);

                    router.use.apply(router, queue);
                }  else {
                    for (type in routeTypes) {
                        if (! routeTypes.hasOwnProperty(type)) {
                            continue;
                        }

                        if (options.types.indexOf(type) < 0) {
                            continue routesLoop;
                        }

                        cb = routeTypes[type].call(this, action, url);
                        if (typeof cb === 'function') {
                            break;
                        }
                    }

                    if (!cb) {
                        throw new Error('Invalid route action:' + route);
                    }

                    queue.push(cb);
                    router[method].apply(router, queue);
                }
            }
        }
    };
};

exports.routeTypes = function(config, controllers) {
    return {
        method (options) {
            if (typeof options !== 'object' || 'method' in options === false) {
                return;
            }

            var name, calls, fn, path, calls;
            name = options.method;
            path = name.split('.');

            fn = helpers.findByPath(controllers, path);
            calls = helpers.findByPath(controllers, path.slice(0, -1));

            if (typeof fn !== 'function') {
                throw new Error('Invalid binding target ' + name);
            }

            function onResult(res, result) {
                if (_.isString(result)) {
                    res.end(result);
                } else if (! _.isObject(result)) {
                    res.end();
                } else if (result instanceof Stream.Readable) {
                    // Only text mode streaming is allowed
                    if (! result.objectMode) {
                        result.pipe(res);
                    } else {
                        result.on('data', function (chunk) {
                            res.write(JSON.stringify(chunk) + '\n');
                        });
                        result.on('end', res.end.bind(res));
                    }
                } else if (helpers.isError(result)) {
                    res.sendError(result);
                } else {
                    res.sendData(result);
                }
            }

            if (fn.constructor.name === 'GeneratorFunction') {
                return function(req, res, next) {
                    var sendResponse = onResult.bind(null, res);
                    co(fn.call(calls, req, res))
                        .then(function(result) {
                            if (! res.headersSent) {
                                sendResponse(result);
                            }
                        }, sendResponse)
                        .catch(next);
                };
            } else {
                return function(req, res, next) {
                    var result;
                    try {
                        result = fn.call(calls, req, res);
                    } catch (err) {
                        result = err;
                        onResult(res, result);
                        return;
                    }

                    if (result instanceof Promise) {
                        promise.then(function (data) {
                            onResult(res, data);
                        }, function (error) {
                            onResult(res, error);
                        })
                        .catch(next);
                    } else if (typeof result !== 'undefined') {
                        onResult(res, result);
                    }
                };
            }
        },
        view (options) {
            if ('view' in options === false) {
                return;
            }

            return function(req, res) {
                var locals = options.locals;
                if (typeof locals === 'function') {
                    locals = locals();
                }

                res.view(
                    options.view,
                    _.extend({
                        params: req.params,
                        user: req.session && req.session.user
                    }, res.locals, locals)
                );
            };
        },
        file (options) {
            if (typeof options !== 'object' || 'file' in options === false) {
                return;
            }

            // TODO Add cache
            return function(req, res, next) {
                var filepath = path.resolve(config.get('dir'), options.file);
                fs.stat(filepath, function(err, stat){
                    if (err) {
                        return next(err);
                    }

                    res.header('content-type', mime.lookup(filepath));
                    res.header('content-length', stat.size);

                    fs.createReadStream(filepath).pipe(res);
                });
            };
        },
        dir (options, route) {
            if (typeof options !== 'object' || 'dir' in options === false) {
                return;
            }

            if (route.slice(-2) !== '**') {
                throw new Error('Dir route should ends with **.');
            }

            return function(req, res, next) {
                var file = req.params[0];
                if (! file) {
                    return next();
                }

                var filepath = path.join(path.resolve(config.get('dir'), options.dir), file);
                fs.exists(filepath, function(status){
                    if (! status) {
                        return next();
                    }

                    fs.stat(filepath, function(err, stat){
                        if (err) {
                            return next(err);
                        }
                        if (! stat.isFile()) {
                            return next(new Error('Not a file'));
                        }

                        res.header('content-type', mime.lookup(filepath));
                        res.header('content-length', stat.size);

                        fs.createReadStream(filepath).pipe(res);
                    });
                });
            };
        }
    };
};
