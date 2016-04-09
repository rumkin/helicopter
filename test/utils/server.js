var spawn = require('child_process').spawn;
var path = require('path');
var _ = require('underscore');

module.exports = function (options) {
    options = _.extend({
        port: process.env.PORT|0 || 8080,
        timeout: 10000
    }, options);

    var port = options.port;

    return new Promise(function (resolve, reject) {
        var stdio = process.env.DEBUG ? 'inherit' : null;
        child = spawn(process.argv[0], ['../bin/helicopter.js', 'up', port], {
            cwd: path.resolve(__dirname, '../../example'),
            stdio: [null, stdio, stdio, 'ipc']
        });

        child.on('error', function (err) {
            reject(err);
        });

        var timeoutId = setTimeout(function () {
            child.removeAllListeners();
            child.kill();
            reject(new Error('Server is not running'));
        }, options.timeout);

        child.on('message', function (message) {
            if (message !== 'up') {
                return;
            }

            child.removeAllListeners('exit');
            child.removeAllListeners('error');
            clearTimeout(timeoutId);

            resolve(child);
        });

        child.on('exit', function (code) {
            reject(new Error('Exit with code', code));
        });
    });
};
