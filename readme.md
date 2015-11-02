# Helicopter

Is a web application framework inspired by SailsJS.

## Install

Helicopter prefer to be installed globally.

```
npm install helicopter -g
```


## Initialize project

Initialize project with `init` command:

```
helicopter init [dir]
```

This command create new structure with basic controllers and events.


## Start server

Application should be started with `up` command:

```
helicopter up [port]
```

### Options

| Name        | Desc                      |
|:------------|:--------------------------|
| `v,verbose` | Make output verbose.      |
| `e,env`     | Specify environment name. |
| `d,debug`   | Turn debug mode on.       |

Run application in development environment example.

```
helicopter up -e development
```

## Run custom command

Helicopter has cli interface to provide application's api which could be called
from terminal:

```
helicopter run <command> -- [...args]
```

Arguments are parsed automatically with simplified argv parser. It uses full name
arguments only like `--name[=value]`. Example:

```bash
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

__NOTE__! Responses shares scope with whall `api` directory. See Scope sharing.
