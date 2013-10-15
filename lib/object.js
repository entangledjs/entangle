
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
 * `store`, `id`, and plain `obj`.
 *
 * @param {Database} store
 * @param {String} id
 * @param {Object} obj
 * @api private
 */

function DO(store, id, obj) {
  this.onchange = this.onchange.bind(this);
  this.driver = store.driver;
  this.obj = obj;
  this.store = store;
  this.id = id;
}

/**
 * Initialize the object by fetching
 * its existing contents (if any).
 *
 * Emits "change" with `.init == true`.
 *
 * @api private
 */

DO.prototype.init = function(){
  var obj = this.obj;
  var id = this.id;
  var self = this;

  this.driver.load(id, function(err, hash){
    debug('init %s %j', id, hash);
    merge(obj, hash);
    self.observe();
    obj.emit('change', { object: obj, init: true, changes: [] });
  });
};

/**
 * Notify `changes` by emitting "change"
 * and more granular "<type> <key>" events.
 *
 * @param {Array} changes
 * @api private
 */

DO.prototype.change = function(changes){
  var obj = this.obj;

  obj.emit('change', { object: obj, init: false, changes: changes });
  changes.forEach(function(change){
    obj.emit(change.type + ' ' + change.name, change);
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

DO.prototype.onchange = function(changes){
  var uid = this.store.uid;
  var id = this.id;
  this.save();
  changes = changes.map(normalizeChange);
  this.driver.pub({ type: 'change', uid: uid, id: id, changes: changes });
};

/**
 * Enable observation.
 *
 * @api private
 */

DO.prototype.observe = function(){
  debug('observe %s %j', this.id, this.obj);
  Object.observe(this.obj, this.onchange);
};

/**
 * Disable observation.
 * 
 * @api private
 */

DO.prototype.unobserve = function(){
  debug('unobserve %s %j', this.id, this.obj);
  Object.unobserve(this.obj, this.onchange);
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

DO.prototype.refresh = function(changes){
  var id = this.id;
  var obj = this.obj;
  var self = this;

  this.driver.load(id, function(err, hash){
    debug('fetch %s %j', id, hash);
    self.unobserve();
    merge(obj, hash);
    self.observe();
    self.change(changes);
  });
};

/**
 * Save the object.
 *
 * @api private
 */

DO.prototype.save = function(){
  var obj = this.obj;
  var id = this.id;
  debug('save %s %j', id, obj);
  this.driver.save(id, clone(this.obj));
};

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
    if ('_events' == key) return;
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