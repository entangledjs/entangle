
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;
var debug = require('debug')('entangle:store');
var DO = require('./object');
var uid = require('uid2');

/**
 * Expose `Store`.
 */

module.exports = Store;

/**
 * Initialize a new store representing
 * many objects, with the given `driver`
 * implementation.
 *
 * The `driver` __must__ implement:
 *
 *  - `.load(id, fn)`
 *  - `.save(id, obj, [fn])`
 *  - `.remove(id, [fn])`
 *  - `.pub(msg, [fn])`
 *  - `.sub(fn)`
 *
 * @param {Object} driver
 * @api public
 */

function Store(driver) {
  this.onmessage = this.onmessage.bind(this);
  driver.sub(this.onmessage);
  this.driver = driver;
  this.uid = uid(10);
  this.map = {};
  debug('uid %s', this.uid);
}

/**
 * Create a distributed object, or `DO` with the
 * arbitary given `id` representing it. For example
 * this might be something like "config", or "users/123".
 *
 * A plain object is returned and manipulations are observed.
 *
 * @param {String} id
 * @return {Object}
 * @api public
 */

Store.prototype.create = function(id){
  var o = new DO(this, id, new Emitter);
  debug('create %s', id);

  // store reference
  this.map[id] = o;

  o.init();
  return o.obj;
};

/**
 * Handle messages.
 *
 *  - refresh on changes to objects
 *
 * @param {Object} msg
 * @api private
 */

Store.prototype.onmessage = function(msg){
  var origin = msg.uid == this.uid;
  debug('msg %j (origin: %s)', msg, origin);

  switch (msg.type) {
    case 'change':
      var o = this.map[msg.id];
      if (origin) o.change(msg.changes)
      else o.refresh(msg.changes);
      break;
  }
};
