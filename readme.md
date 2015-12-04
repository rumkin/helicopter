# Helicopter

Is a web application framework inspired by SailsJS.

## Install

Install helicopter via npm.

```shell
npm install helicopter
```

To have nice cli binary you can also install [helicpoter-cli](https://www.npmjs.com/package/helicopter-cli).
```shell
npm install helicopter-cli -g
```

## Initialize project

Initialize project with `init` command:

```shell
helicopter init [dir]
```

This command create new structure with basic structure. To create project from
template use `create` command which will download template from github or npm:

```shell
helicopter create helicopterjs/basic .
```


## Start server

Application should be started with `up` command:

```shell
helicopter up [port]
```

### Options

| Name        | Desc                      |
|:------------|:--------------------------|
| `v,verbose` | Make output verbose.      |
| `e,env`     | Specify environment name. |
| `d,debug`   | Turn debug mode on.       |

Run application in development environment example.

```shell
helicopter up -e development
```

## Run custom command

Helicopter has cli interface to provide application's api which could be called
from terminal:

```shell
helicopter run <command> -- [...args]
```

Arguments are parsed automatically with simplified argv parser. It uses full name
arguments only like `--name[=value]`. Example:

```shell
helicopter run dump -- --mongo-db=test --dir=./test/ --overwrite
```

### Options

| Name        | Desc                      |
|:------------|:--------------------------|
| `v,verbose` | Make output verbose.      |
| `e,env`     | Specify environment name. |
| `d,debug`   | Turn debug mode on.       |

### Example

Commands are specified with `commands` method of main app class stored in `app.js`.
This method should return dictionary of commands where key is a command name in
camel case and value is object descriptor of command. This method should
contains several keys: params, description and action.

```javascript
Helicopter.extend({
  commands() {
    return {
      print: {
        params: '[text]',
        description: 'Print console arguments',
        action: (text) => {
          this.service('Print').print(text);
        }
      }
    };
  }
});
```

## Filesystem layout

Default layout has 3 separated folders to separate code on levels `api`,
`config` and `modules`. Basic example:

```
.
|-- api
|   |-- controllers
|   |   `-- main-controller.js
|   |-- events
|   |   `-- main-events.js
|   |-- models
|   `-- services
|   |   `-- print-service.js
|-- config
|   |-- app.js
|   |-- development
|   |   `-- app.js
|   |-- events.js
|   |-- http.js
|   |-- production
|   `-- routes.js
|-- modules
|-- app.js
`-- package.json
```

But you can choose your own layout system with overwriting core modules
configuration.

## Controllers

Usually controllers stored in `api/controllers` directory in files with postfix
`-controller.js`. Each controller file should export an object which methods
will be used as http methods. Routes could be configured manually in
`config/routes.js` file and could differ for different environments.

Controller example.

```javascript
// config/routes.js
exports.routes = {
  'GET /hello' : {
    method: 'test.hello'
  }
};

// api/controllers/test.js
module.exports = {
  hello(req, res) {
    res.end('Hello world');
  }
};
```

Controller method also could be a generator thus it will be wrapped with [`co`](http://npmjs.org/packages/co).
Web controller could return promise and it's result will be used as http output.
Each return result will be wrapped with customization [responses](#responces)
(`sendData` and `sendError`).

## Responses

HTTP-interface supports custom response system to provide wide functionality.
There is two ways of using responses: manual in the code `res.notFound()` or
automatically by router which will run methods `res.sendError` if controllers
method returns instance of error and `res.sendData` when method returns an
object.

Response file exports factory which returns new method. Example:

```javascript
// responses/not-found.js
module.exports = function(req, res) {
  return function (message) {
    this.status(404)
      .end(message || 'Nothing found');
  };
};
```

__NOTE__! Responses shares scope with whole `api` directory. See wide scope.

## Wide scope

Helicopter use it's own require mechanism which share scope of all files from
`api` directory and allows to avoid mess of requires or other tricks with using
initialized modules. This way controllers could access to services by it's name.

Example.

```javascript
// services/print-service.js
module.exports = function () {
  return {
    print: function (msg) {
      console.log(msg);
    }
  }
};
```

Using of print service in controller:
```javascript
// controllers/print-controller.js
module.exports = {
  print (req, res) {
    PrintService.print(req.body);
    res.end();
  }
};
```

## Misc

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/rumkin/helicopter/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
