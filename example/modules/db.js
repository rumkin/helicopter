// Database connection
exports.db = function() {
    var db = {};
    // Initialize database instance
    return db;
};

// Database initialization
exports.startDb = function(config, db, onStart) {
    onStart.push(function(){
        return new Promise(function(resolve){
            setTimeout(function(){
                if (config.get('verbose')) {
                    console.log('DB connection established');
                }
                resolve();
            }, 500);
        });
    });
};
