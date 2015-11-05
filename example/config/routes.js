exports.routes = {
    'GET /echo': {
        method: 'test.echo'
    },
    'GET /hello': {
        method: 'test.hello'
    },
    'GET /text': {
        method: 'test.text'
    },
    'GET /stream': {
        method: 'test.stream'
    },
    'GET /object': {
        method: 'test.object'
    },
    'GET /error': {
        method: 'test.error'
    },
    'GET /throws': {
        method: 'test.throws'
    },
    'POST /events/:event': {
        method: 'test.events'
    }
};
