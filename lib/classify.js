module.exports = classify;

/**
 * Static class inheritance method. Create new class and make holder object
 * the prototype of new class.
 *
 * @param  {object} proto Prototype methods and properties.
 * @return {function}       New child class constructor.
 * @example
 * var Rect = Geometry.extend({
 * 	constructor(x, y, width, height) {
 * 		Geometry.call(this, x, y);
 *
 * 		this.width = width;
 * 		this.height = height;
 * 	 }
 * 	});
 */
function createClass (proto) {
  var Super = this;
    var ctor;

    if (typeof proto === 'object') {
        if (proto.hasOwnProperty('constructor')) {
            ctor = proto.constructor;
        } else {
            ctor = function () {
                Super.apply(this, arguments);
            };
        }
    } else if (typeof proto === 'function') {
        ctor = proto;
        proto = arguments[1] || {};
    }

    Object.setPrototypeOf(ctor.prototype, this.prototype);

    // Copy static methods and properties.
    Object.getOwnPropertyNames(Super).forEach((name) => {
        if (['arguments', 'length', 'name', 'caller', 'prototype'].indexOf(name) > -1) {
            return;
        }

        Object.defineProperty(
          ctor,
          name,
          Object.getOwnPropertyDescriptor(Super, name)
        );
    });

    // Copy prototype methods and properties.
    Object.getOwnPropertyNames(proto).forEach((name) => {
        if (name === 'constructor') {
            return;
        }

        Object.defineProperty(
          ctor.prototype,
          name,
          Object.getOwnPropertyDescriptor(proto, name)
        );
    });

    return ctor;
}

/**
 * Static instance initializer (new)
 *
 * @return {Object} Return `this` instance.
 * @example
 * new SomeClass() // -> SomeClass {}
 * SomeClass.new(); // -> SomeClass {}
 */
function newClass() {
    var instance = Object.create(this.prototype);
    this.apply(instance, arguments);
    return instance;
};

/**
 * Check if object is an instance of prototype.
 *
 * @param  {Object}  target Target object.
 * @return {Boolean}        return true if target has this.prototype in
 * prototypes chain.
 */
function inherited(target) {
    return this.prototype.isPrototypeOf(target);
}

/**
 * Add class methods to function.
 *
 * @param  {Function} target Constructor.
 * @return {Function}        target function.
 */
function classify(target) {
    target.extend = createClass;
    target.new = newClass;
    target.inherited = inherited;

    return target;
}
