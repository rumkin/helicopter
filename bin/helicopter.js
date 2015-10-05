#!/usr/bin/env node

var path = require('path');
var commander = require('commander');
var chalk = require('chalk');

commander
    .command('up [port] [host]')
    .description('Start server')
    .option('-e,--env [name]', 'Environment name')
    .option('-v,--verbose', 'Verbose output')
    .action(function (port, host, options) {
        var App = require(path.join(process.cwd(), './app.js'));
        var app = new App({
            dir: process.cwd(),
            env: options.env || process.env.NODE_ENV || 'production'
        });

        if (options.verbose) {
            app.config.verbose = options.verbose;
        }

        app.init(options);

        app.inject(function(config, server, init) {
            port = port || config.get('network.port', '8080');
            host = host || config.get('network.host', '0.0.0.0');
            server(config.get('http')).listen(port, host, function () {
                config.get('verbose') && console.log('Server started at %s:%s', chalk.bold(host), chalk.green(port));
            });
        });
    });

commander
    .command('run <command>')
    .option('-e,--env', 'Environment name')
    .option('-v,--verbose', 'Verbose output')
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
        app.factory('commands', app.commands.bind(app));

        var args = process.argv.slice(process.argv.indexOf('--') + 1);

        app.inject('commands', function (commands) {
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

            sub.parse(['', '', command].concat(args));
        });
    });

commander.parse(process.argv);
