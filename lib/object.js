
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;
var debug = require('debug')('entangle:object');

/**
 * Map of new type names, specifically
 * for the "<type> <key>" events so that
 * they read better.
 */

var types = {
  updated: 'change',
  deleted: 'delete',
  reconfigured: 'reconfigure'
};

/**
 * Expose `DO`.
 */

module.exports = DO;

/**
 * Initialize a distributed object with
 * `store` and `id`.
 *
 * @param {Database} store
 * @param {String} id
 * @api private
 */

function DO(store, id) {
  this._onchange = this._onchange.bind(this);
  this._driver = store.driver;
  this._store = store;
  this._id = id;
}

/**
 * Inherit from `Emitter.prototype`.
 */

DO.prototype.__proto__ = Emitter.prototype;

/**
 * Set `props` silently, aka the changes
 * will _not_ be broadcasted to peers. This
 * is useful for things like local initialization
 * from disk.
 *
 * @param {Object} obj
 * @api public
 */

DO.prototype.set = function(obj){
  this._unobserve();
  merge(this, obj);
  this._observe();
};

/**
 * Return an inspected version of the object
 * void of all book-keeping.
 *
 * @return {Object}
 * @api public
 */

DO.prototype.inspect = function(){
  return clone(this);
};

/**
 * Return JSON representation.
 *
 * @return {Object}
 * @api public
 */

DO.prototype.toJSON = function(){
  return clone(this);
};

/**
 * Initialize the object by fetching
 * its existing contents (if any).
 *
 * Emits "change" with `.init == true`.
 *
 * @api private
 */

DO.prototype._init = function(){
  var id = this._id;
  var self = this;

  this._driver.load(id, function(err, hash){
    debug('init %s %j', id, hash);
    merge(self, hash);
    self._observe();
    self.emit('change', { object: self, init: true, changes: [] });
  });
};

/**
 * Notify `changes` by emitting "change"
 * and more granular "<type> <key>" events.
 *
 * @param {Array} changes
 * @api private
 */

DO.prototype._change = function(changes){
  var self = this;
  this.emit('change', { object: this, init: false, changes: changes });
  changes.forEach(function(change){
    self.emit(change.type + ' ' + change.name, change);
  });
};

/**
 * Handle changes to the object, save the
 * object, and publish a "change" event.
 *
 * TODO: consider packing as "change:<uid>:<id>"
 * instead of json serialization.
 *
 * @param {Array} changes
 * @api private
 */

DO.prototype._onchange = function(changes){
  var uid = this._store.uid;
  var id = this._id;
  this._save();
  changes = changes.map(normalizeChange);
  this._driver.pub({ type: 'change', uid: uid, id: id, changes: changes });
};

/**
 * Enable observation.
 *
 * @api private
 */

DO.prototype._observe = function(){
  debug('observe %s %j', this._id, this);
  Object.observe(this, this._onchange);
};

/**
 * Disable observation.
 * 
 * @api private
 */

DO.prototype._unobserve = function(){
  debug('unobserve %s %j', this._id, this);
  Object.unobserve(this, this._onchange);
};

/**
 * Refresh the object's contents to reflect
 * what is available in the datastore.
 *
 * Here we must .unobserve() before making
 * changes to the object due to the non-deterministic
 * timing of observations.
 *
 * @api private
 */

DO.prototype._refresh = function(changes){
  var id = this._id;
  var self = this;

  this._driver.load(id, function(err, obj){
    debug('fetch %s %j', id, obj);
    self.set(obj);
    self._change(changes);
  });
};

/**
 * Save the object.
 *
 * @api private
 */

DO.prototype._save = function(){
  var id = this._id;
  debug('save %s %j', id, this);
  this._driver.save(id, this.toJSON());
};

/**
 * Check if `key` is private.
 *
 * @param {String} key
 * @return {Boolean}
 * @api private
 */

function isPrivateKey(key) {
  return 'domain' == key
    || '_' == key[0];
}

/**
 * Normalize `change` object to return:
 *
 *  - `type`
 *  - `name`
 *  - `old`
 *  - `value`
 *
 * @param {Object} change
 * @return {Object}
 * @api private
 */

function normalizeChange(change) {
  var ret = {};
  ret.type = types[change.type] || change.type;
  ret.name = change.name;
  if ('oldValue' in change) ret.old = change.oldValue;
  ret.value = change.object[change.name];
  return ret;
}

/**
 * Shallow clone.
 * 
 * @api private
 */

function clone(obj) {
  var ret = {};
  
  Object.keys(obj).forEach(function(key){
    if (isPrivateKey(key)) return;
    ret[key] = obj[key];
  });

  return ret;
}

/**
 * Merge `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @api private
 */

function merge(a, b) {
  Object.keys(b).forEach(function(key){
    a[key] = b[key];
  });
}