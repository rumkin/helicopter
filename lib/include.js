'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var Module = require('module');

module.exports = include;
module.exports.createScope = createScope;

var scopeCounter = 0;
var cache = {};
var scopeSymbol = Symbol('ScopeID');
var resolvedArgv;

function include(filepath, scope) {
    var scopeId = scope[scopeSymbol];
    if (! scopeId) {
        scopeId = (++scopeCounter);
        Object.defineProperty(scope, scopeSymbol, {
            enumerable : false,
            get : function() {
                return scopeId;
            }
        });
        cache[scopeId] = {};
    }

    if (filepath in cache[scopeId]) {
        return cache[scopeId][filepath];
    }

    var code = loadSource(filepath);
    var subModule = new Module(filepath);
    subModule._compile = _moduleCompile;
    subModule.paths = [
        path.dirname(filepath)
    ];

    var paths = path.resolve(path.dirname(module.id), filepath).split(path.sep).slice(0, -1);
    while (paths.length) {
        subModule.paths.push(paths.join(path.sep) + '/node_modules');
        paths.pop();
    }

    return cache[scopeId][filepath] = subModule._compile(code, filepath, scope);
}

function createScope(scope) {
    scope = scope||{};
    var scopeId = 'scope#' + (++scopeCounter);
    Object.defineProperty(scope, '@@scopeId', {
        enumerable: false,
        get : function(){
            return scopeId;
        }
    });
    cache[scopeId] = {};
    return scope;
}

function loadSource(filepath) {
    var content = fs.readFileSync(filepath, 'utf-8');
    // Cut BOM
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    return content;
}

function _moduleCompile (content, filename, locals) {
    var self = this;
    // remove shebang
    content = content.replace(/^\#\!.*/, '');

    locals = {__proto__:locals};


    function require(request) {
        if (request.charAt(0) === '.') {
            request = path.resolve(path.dirname(filename), request);
        }
        return self.require(request);
    }

    require.resolve = function(request) {
        return Module._resolveFilename(request, self);
    };

    require.include = function(subpath) {
        return include(require.resolve(path.resolve(path.dirname(filename), subpath)), locals);
    };

    Object.defineProperty(require, 'paths', {
        get() {
            throw new Error('require.paths is removed. Use ' +
            'node_modules folders, or the NODE_PATH ' +
            'environment variable instead.');
        }
    });

    require.main = process.mainModule;

    // Enable support to add extra extension types
    require.extensions = Module._extensions;
    require.registerExtension = function() {
        throw new Error('require.registerExtension() removed. Use ' +
        'require.extensions instead.');
    };

    require.cache = Module._cache;

    var dirname = path.dirname(filename);
    // TODO Decide about event name
    // TODO Check arguments
    process.emit('moduleIncluded', module, locals);

    // create wrapper function
    var wrapper
        = '(function (exports, require, module, __filename, __dirname, locals)'
        + '{ with(locals){ (function(){\'use strict\';'
        + content
        + '\n}).call(exports)}});';

    var compiledWrapper = vm.runInThisContext(wrapper, filename);
    if (global.v8debug) {
        if (! resolvedArgv) {
            // we enter the repl if we're not given a filename argument.
            if (process.argv[1]) {
                resolvedArgv = Module._resolveFilename(process.argv[1], null);
            } else {
                resolvedArgv = 'repl';
            }
        }

        // Set breakpoint on module start
        if (filename === resolvedArgv) {
            global.v8debug.Debug.setBreakPoint(compiledWrapper, 0, 0);
        }
    }
    var args = [self.exports, require, self, filename, dirname, locals];
    compiledWrapper.apply(self.exports, args);

    return self.exports;
}
