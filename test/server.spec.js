var fetch = require('node-fetch');
var test = require('unit.js');
var inspect = require('util').inspect;
var server = require('./utils/server.js');

describe('Example server', function () {
    var child;
    var port = 8080;

    before(function () {
        return server({
            port: port
        }).then(function (_child) {
            child = _child;
        });
    });

    after(function () {
        child.kill();
    });

    it('Should response on http request', function () {
        var text = 'hi';
        return fetch(`http://localhost:${port}/echo?text=${text}`)
        .then((res) => {
            return res.text();
        })
        .then((body) => {
            test.string(body).is(text);
        })
        ;
    });

    it('Should response on /object with data response', function () {
        return fetch(`http://localhost:${port}/object`)
        .then((res) => {
            return res.json();
        })
        .then((body) => {
            test.object(body);
            test.value(body.error).is(null);
            test.object(body.data).hasProperty('status', true);
        })
        ;
    });

    it('Should response on /throws with error response', function () {
        return fetch(`http://localhost:${port}/throws`)
        .then((res) => {
            return res.json();
        })
        .then((body) => {
            test.object(body);
            test.value(body.data).is(null);
            test.string(body.error).is('throws error');
        })
        ;
    });
});
