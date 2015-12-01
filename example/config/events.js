exports.events = {
    bind: {
        message: {
            send: true,
            promise: true,
            error: true,
            nativeError: true
        }
    },
    onConnect: 'message.connected',
    onDisconnect: 'message.disconnected'
};
