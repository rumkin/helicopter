#!/usr/bin/env node

var path = require('path');
var commander = require('commander');
var chalk = require('chalk');
var fs = require('fs');
var childProcess = require('child_process');

commander
    .command('up [port] [host]')
    .description('Start server')
    .option('-e,--env [name]', 'Environment name')
    .option('-v,--verbose', 'Verbose output')
    .option('-d,--debug', 'Force debug mode')
    .action(function (port, host, options) {
        var App = require(path.join(process.cwd(), './app.js'));
        var app = new App({
            dir: process.cwd(),
            env: options.env || process.env.NODE_ENV || 'production'
        });

        if (options.verbose) {
            app.config.verbose = options.verbose;
        }

        if (options.debug) {
            app.config.debug = options.debug;
        }

        app.init(options);

        app.inject(function(init, config, server, socketIo, onStart, onExit) {
            port = port || config.get('network.port', '8080');
            host = host || config.get('network.host', '0.0.0.0');

            onStart.then(() => {
                process.on('exit SIGINT SIGTERM', function(){
                    onExit.then().catch((error) => {
                        process.exit(1);
                    }).then(() => {
                        process.exit();
                    });
                });

                server(config.get('http')).listen(port, host, function () {
                    socketIo(this);

                    config.get('verbose') && console.log(
                        'Server started at %s:%s',
                        chalk.bold(host),
                        chalk.green(port)
                    );

                    if (process.send) {
                        process.send('up');
                    }
                });
            })
            .catch(error => {
                console.error(error.stack);
                process.exit(1);
            });
        });
    });

commander
    .command('exec <command>')
    .option('-e,--env', 'Environment name')
    .option('-v,--verbose', 'Verbose output')
    .option('-d,--debug', 'Force debug mode')
    .description('Run custom application command')
    .action(function (command, options) {
        var App = require(path.join(process.cwd(), './app.js'));
        var app = new App({
            dir: process.cwd(),
            env: options.env || process.env.NODE_ENV || 'production'
        });

        if (options.verbose) {
            app.config.verbose = options.verbose;
        }

        app.init(options);

        var args, i;
        i = process.argv.indexOf('--');
        if (i > -1) {
            args = process.argv.slice(i + 1);
        } else {
            args = process.argv.slice(4);
        }

        app.inject(function (services) {
            var commands = app.commands();
            var name = command.replace(/\W(.)/g, (m, v) => v.toUpperCase());

            if (! commands.hasOwnProperty(name)) {
                throw new Error('Command not found');
            }

            var sub = new commander.Command();

            Object.getOwnPropertyNames(commands).forEach(function (name) {
                var desc = commands[name];
                var fullName = name;
                if (desc.params) {
                    fullName += ' ' + desc.params;
                }
                var subCmd = sub.command(fullName);

                subCmd.description(commands.desc);
                if (desc.options) {
                    desc.options.forEach(function (option) {
                        subCmd.option.apply(subCmd, option);
                    });
                }

                subCmd.action(desc.action);
            });

            if (process.send) {
                process.send('exec');
            }

            sub.parse(['', '', name].concat(args));
        });
    });

commander.parse(process.argv);
