exports.http = {
    order : [
        'logger',
        'responses',
        'assets',
        'bodyParser',
        'session',
        'upload',
        'overwriteHeaders',
        'favicon',
        'routes',
        'errors'
    ],
    middlewares : {
        session: {
            secret: 'helicopter-secret-string',
            resave: true,
            saveUninitialized: true
        },
        assets : {
            dir : __dirname + '/../public'
        },
        favicon: 'smile',
        routes : {
            // Enabled route types:
            // - method for bound methods object
            // - file for static files FROM routesOptions.dir or from this object dir property!
            // - view for direct view render
            types : ['method', 'file', 'view', 'dir'],
            // routes base dir property
            dir : __dirname + '/../public'
        },
        bodyParser : {
            urlencoded: {
                extended: false
            },
            json: true
        },
        upload : {
            uploadDir : __dirname + '/../tmp/uploads',
            autoFiles : true
        }
    }
};
