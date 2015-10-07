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


## Run

Application should be started with `up` command:

```
helicopter up [port]
```

Options:

| Name        | Desc                      |
|:------------|:--------------------------|
| `v,verbose` | Make output verbose.      |
| `e,env`     | Specify environment name. |

Run application in development environment example.

```
helicopter up -e development
```
