var client = require('socket.io-client')('http://localhost:7000/');

var event = process.argv[2] || 'message.send';

client.on('connect', function () {
    client.emit(event, {
        text:'hello'
    }, function (result) {
        console.log('Result', result);
        client.close();
    });
});

client.on('error', (error) => {
    console.error(error);
});
