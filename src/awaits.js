exports.awaits = function() {
    return function() {
        var awaits = [];
        var started = false;

        return {
            get started() {
                return started;
            },
            get length() {
                return awaits.length;
            },
            push() {
                if (started) {
                    throw new Error('Already started');
                }

                awaits.push(...arguments);
            },
            then() {
                return (new Promise((resolve, reject) => {
                    var onSuccess, onError;

                    onSuccess = function() {
                        if (! awaits.length) {
                            resolve();
                            return;
                        }

                        var fn = awaits.shift();
                        var result;
                        try {
                            result = fn();
                        } catch (err) {
                            onError(err);
                            return;
                        }

                        if (result instanceof Promise === false) {
                            result = Promise.resolve(result);
                        }

                        result.then(onSuccess, onError);
                    };

                    onError = function(error) {
                        reject(error);
                    };

                    if (started) {
                        onError(new Error('Already started'));
                        return;
                    }

                    onSuccess();
                })).then(...arguments);
            },
            catch(func) {
                return this.then(null, func);
            }
        };
    };
};

exports.onStart = function(awaits) {
    return awaits();
};

exports.onExit = function(awaits) {
    return awaits();
};
