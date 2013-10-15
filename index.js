
/**
 * Module dependencies.
 */

var Store = require('./lib/store');

/**
 * Initialize a distributed object store
 * with the given `client` implementation.
 *
 * @param {Object} client
 * @return {Function}
 * @api public
 */

module.exports = function(client){
  var db = new Store(client);
  return function(name, obj){
    return db.create(name);
  }
};
