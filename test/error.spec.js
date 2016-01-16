var test = require('unit.js');
var Helicopter = require('../');

describe('Helicopter.Error', () => {
    it('Should be an instance of Error', () => {
        var error = new Helicopter.Error();

        test.object(error).isInstanceOf(Error);
    });

    it('Set default code', () => {
        var message = 'Error';
        var error = new Helicopter.Error(message);

        test.object(error)
            .hasProperty('code', Helicopter.Error.DEFAULT_CODE)
            .hasProperty('message', message)
            ;
    });

    it('Should substitute values', () => {
        var message = 'Not found: ${path}';
        var path = 'file.txt';

        var error = new Helicopter.Error(message, {path: path});

        test.object(error)
            .hasProperty('message', 'Not found: ' + path);
    });
});
