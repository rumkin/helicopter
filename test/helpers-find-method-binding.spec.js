var test = require('unit.js');
var helpers = require('../src/helpers.js');

describe('findMethodBinding()', function () {
    it('Should found method on the first level', function () {
        var context = {
            hello: function () {
                return 42;
            }
        };

        var fn = helpers.findMethodBinding(context, 'hello');

        test.function(fn);
        test.value(fn()).is(42);
    });

    it('Should return undefined if method is not a function', function () {
        var context = {
            hello: 42
        };

        var fn = helpers.findMethodBinding(context, 'hello');

        test.value(fn).is(undefined);
    });

    it('Should return method on the second level', function () {
        var context = {
            user: {
                hello: function () {
                    return 42;
                }
            }
        };

        var fn = helpers.findMethodBinding(context, 'user.hello');

        test.function(fn);
        test.value(fn()).is(42);
    });

    it('Should return method if path is array', function () {
        var context = {
            user: {
                hello: function () {
                    return 42;
                }
            }
        };

        var fn = helpers.findMethodBinding(context, ['user', 'hello']);

        test.function(fn);
        test.value(fn()).is(42);
    });

    it('Should bind arguments', function () {
        var context = {
            add: function (x, y) {
                return x + y;
            }
        };

        var fn = helpers.findMethodBinding(context, 'add', 1);

        test.function(fn);
        test.value(fn(41)).is(42);
    });
});
