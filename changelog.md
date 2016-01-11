# 0.1.39
* **Maybe breaking**. Router method result with type `undefined` prevent
  response sending.
* Update `req.upload()`. Uploaded fields assign as `req.body` and uploaded files
  assign as `req.files`.

# 0.1.37
* Add keywords to `package.json`.
* Add `extend` option for controllers.
* Fix `exec` command arguments.
* Rename bin command `run` into `exec`.
* Replace template with template engine.
* Remove `init` command from helicopter binary. Move it to helicopter-cli.
* Add socket event listener `onError`.
* Update socket event callback: argument #1 is always the socket.

# 0.1.29
* Check if response headers are sent for generator and promised methods.
* Fix bugs in helpers.
* Add socket events `connect` and `disconnect` bindings.

# 0.1.22
* Remove `emoji-favicon` from dependencies.
* Replace `inherits` with `Object.setPrototypeOf` in main class.

# 0.1.20
* Update `singular` module.

# 0.1.19
* Add socket instance to event method callbacks.
* Update promise wrapper helper.

# 0.1.17
* Enhance router response processing.
* Create basic server tests.
* Enhance example.

# 0.1.15
* Fix controller return methods result processing. If return is undefined then
  no processing will be done. If result is an instance of Promise then promise
  result will be used as an output values.
* Add custom response methods for `method` routes: response.sendError and
  response.sendData.
* Add `Events` object to wide scope. This object holds all events objects from
  event's directory.
* Rename events objects with upper camel case.
* Add promisified call.

# 0.1.9
* Add `debug` cli option.
* Update events error interface.

# 0.1.7

* Add socket.io events.
* Fix UpperCamelCase helper error.
* Update socket.io error with HelicopterError and debug output.

# 0.1.2

* Add core components configuration to `core` namespace:
  * `core.modules`
  * `core.events`
  * `core.controllers`
* Add `.editorconfig` and `.eslint` files into template.

# 0.1.0

* Add `init` command with simple copy of example.
* Add models and modules folders to example.
* Create template folder.
