var express = require('express');
var path  = require('path');
var chalk = require('chalk');
var _ = require('underscore');
var multiparty = require('multiparty');
var bodyParser = require('body-parser');
var co = require('co');

exports.server = function($$) {
    return function(options){
        var server = express();

        options.order.forEach(function(name){
            var appName = name + 'Http';
            var factory;
            if (! $$.hasEntity(appName)) {
                throw new Error('Unknown middleware factory ' + name);
            }

            factory = $$.get(appName);
            factory(server, options.middlewares[name] || {});
        });

        return server;
    };
};

// Serve static files
exports.assetsHttp = function(config) {
    var express = require('express');
    return function(server, options) {
        server.use(express.static(path.resolve(config.get('dir'), options.dir)));
    };
};

// HTTP Requests logger
exports.loggerHttp = function(config) {
    var replace = require('./helpers.js').replace;
    var defaultFormat = '${code} ${method} ${url} - ${time} ms';

    return function(server, options) {
        server.use(function(req, res, next){
            var start = Date.now();

            res.on('finish', function(){
                var code = res.statusCode;
                switch (Math.round(code/100)) {
                    case 4:
                        code = chalk.grey(code);
                        break;
                    case 3:
                        code = chalk.yellow(code);
                        break;
                    case 2:
                        code = chalk.green(code);
                        break;
                }

                var format = options.format || config.get('logger.http') || defaultFormat;
                console.log(replace(format, {
                    code : code,
                    method : req.method,
                    url : req.url,
                    time : chalk.bold(Date.now() - start)
                }));
            });
            next();
        });
    };
};

exports.exportLocalsHttp = function(config){
    return function (server) {
        server.use(function(req, res, next){
            res.locals.config = config.all();
            res.locals.HOST = req.headers.host;
            res.locals.HOSTNAME = req.hostname;
            res.locals.DOMAINS = req.hostname.split('.').reverse();
            res.locals.PATHNAME = req.pathname;

            next();
        });
    };
};


exports.overwriteHeadersHttp = function() {
    return function (server) {
        server.use(function (req, res, next) {
            var headers = {};
            Object.keys(req.headers).forEach(function(header){
                var camel = header.replace(/-\w/g, function(m){
                    return m.slice(1).toUpperCase();
                });
                headers[camel] = req.headers[header];
            });

            req.head = headers;
            next();
        });
    };
};

// HTTP file uploader and form parser
exports.uploadHttp = function(config) {
    return function(server, options) {
        server.use(function(req, res, next){
            req.upload = function(callback) {
                var promise = new Promise(function(resolve, reject){
                    var defaults = config.get('upload', {});
                    (new multiparty.Form(_.extend({}, defaults, options)).parse(req, function(err, fields, files){
                        if (err) {
                            reject(err);
                        } else {
                            req.body = {
                                fields: fields,
                                files: files
                            };
                            resolve(req.body);
                        }
                    }));
                });

                if (callback) {
                    return promise.then(callback.bind(null, null), callback);
                } else {
                    return promise;
                }
            };
            next();
        });
    };
};

// Favicon generator factory
exports.faviconHttp = function() {
    var emojiFavicon = require('emoji-favicon');
    return function favicon (server, options) {
       server.use(emojiFavicon(options));
   };
};

// Add shorthand methods response
exports.responsesHttp = function(responses) {
    return function(server) {
        var names = Object.getOwnPropertyNames(responses);
        server.use(function (req, res, next){
            names.forEach(function(name){
                if (name in res) {
                    throw new Error('Response name "' + name + '" already taken.');
                }

                res[name] = responses[name](req, res);
            });
            next();
        });
    };
};

exports.sessionHttp = function() {
    var session = require('express-session');
    return function(server, options){
        server.use(session(options));
    };
};

exports.testHttp = function(config){
    return function(server){
        server.use(config.get('http.options.test'));
    };
};

// Body parser
exports.bodyParserHttp = function() {
    return function(server, options){
        if (options.json) {
            server.use(bodyParser.json(options.json === true ? {} : options.json));
        }

        if (options.urlencoded) {
            server.use(bodyParser.urlencoded(options.urlencoded === true ? {} : options.urlencoded));
        }

        if (options.raw) {
            server.use(bodyParser.raw(options.raw === true ? {} : options.raw));
        }
    };
};

exports.hostHttp = function() {
    return function(server, options) {
        if (options === true) {
            return;
        }

        if (! Array.isArray(options)) {
            options = [options];
        }

        server.use(function(req, res, next){
            if (options.indexOf(req.hostname) < 0) {
                return next(404);
            }

            next();
        });
    };
};

exports.originHttp = function() {
    var url = require('url');

    return function(server, options) {
        server.use(function(req, res, next){
            if (! req.headers.origin) {
                return next();
            }

            var origin = url.parse(req.headers.origin);

            if (options.hasOwnProperty(origin.hostname)) {
                var settings = options[origin.hostname];

                if (! settings) {
                    return next();
                }

                res.header('Access-Control-Allow-Origin', req.headers.origin);

                if (settings === true) {
                    res.header('Access-Control-Allow-Methods', 'GET');
                } else if (Array.isArray(settings)) {
                    res.header('Access-Control-Allow-Methods', settings.join(','));
                } else if (typeof settings === 'object') {
                    res.header('Access-Control-Allow-Methods', settings.methods.join(','));
                    res.header('Access-Control-Allow-Headers', settings.headers.join(','));
                }

                next();
            }
        });
    };
};

/**
 * Response on errors with custom responses methods.
 *
 * @return {function(server:object,options:object)} Server modificator.
 */
exports.customErrorsHttp = function () {
    return function (server) {
        server.use(function(req, res, next){
            if (typeof res.notFound === 'function') {
                res.notFound();
            } else {
                next();
            }
        });

        server.use(function(error, req, res, next){
            if (! error) {
                return res.serverError('Unknown error');
            }

            function response(name) {
                if (typeof res[name] === 'function') {
                    res[name].apply(res, arguments);
                } else {
                    next(error);
                }
            }

            switch (error) {
                case 400:
                    response('badRequest');
                    break;
                case 403:
                    response('forbidden');
                    break;
                case 404:
                    response('notFound');
                    break;
                default:
                    responce('serverError', error);
            }
        });
    };
};

/**
 * Plain text error responces.
 *
 * @return {function(server:object,options:object)} Error middleware modifier.
 */
exports.errorsHttp = function(config) {
    return function (server) {
        server.use(function (req, res, next) {
            next(404);
        });

        server.use(function(error, req, res, next){
            if (! error) {
                error = 404;
            }

            res.header('content-type', 'text/plain;charset=utf-8');
            switch (error) {
                case 400:
                    res.status(error).end('Bad request');
                    break;
                case 403:
                    res.status(error).end('Forbidden');
                    break;
                case 404:
                    res.status(error).end('Noting Found');
                    break;
                default:
                    res.status(500);
                    res.write('Error');

                    if (config.get('debug')) {
                        res.write('\n' + (error.stack || error));
                    }

                    res.end();
            }
        });
    };
};
