var test = require('unit.js');
var helpers = require('../src/helpers.js');

describe('Promisify', function () {
    it('Should create method with promise', function () {
        var fn = helpers.promisify(function (cb) {
            setImmediate(cb);
        });

        var result = fn();
        test.bool(result instanceof Promise).isTrue();
    });

    it('Should fullfil on callback success', function (done) {
        var fn = helpers.promisify(function (cb) {
            setImmediate(cb);
        });

        fn().then(function () {
            done();
        });
    });

    it('Should fail on callback error', function (done) {
        var fn = helpers.promisify(function (cb) {
            setImmediate(cb, new Error('test'));
        });

        fn().then(null, function (error) {
            test.object(error);
            test.string(error.message).contains('test');

            done();
        });
    });

    it('Should pass arguments', function () {
        var fn = helpers.promisify(function (a, b, cb) {
            setImmediate(cb, null, [a, b]);
        });

        return fn(1, 2).then(function (args) {
            test.array(args);
            test.number(args[0]).is(1);
            test.number(args[1]).is(2);
        });
    });

    it('Should pass context if specified', function () {
        var ctx = {};
        var fn = helpers.promisify(function (cb) {
            setImmediate(cb, null, this);
        }, ctx);

        return fn().then((self) => {
            test.object(self).is(ctx);
        });
    });

    it('Should overwrite context with .call if no context was specified', function () {
        var ctx = {};
        var fn = helpers.promisify(function (cb) {
            setImmediate(cb, null, this);
        });

        return fn.call(ctx).then((self) => {
            test.object(self).is(ctx);
        });
    });

    it('Should not overwrite context with .call if context was specified', function () {
        var ctx = {};
        var fn = helpers.promisify(function (cb) {
            setImmediate(cb, null, this);
        }, {});

        return fn.call(ctx).then((self) => {
            test.bool(self === ctx).isFalse();
        });
    });

    it('Should properly use inner promise', function (done) {
        var fn = helpers.promisify(function () {
            return new Promise(function (resolve) {
                setImmediate(resolve, true);
            });
        });

        fn().then(function (result) {
            test.bool(result).isTrue();
            done();
        });
    });
});
