
/*!
 *
 * sublevel
 *
 * sublevels for levelup without the complexity
 *
 * MIT
 *
 */

/**
 * Module dependencies.
 */

var through = require('through');

/**
 * Expose `Sub`.
 */

module.exports = Sub;

/**
 * Path separator.
 */

var sep = '/';

/**
 * Sub.
 *
 * @param {LevelUP} db
 * @param {String} path
 * @param {Object} [options]
 * @api public
 */

function Sub(db, path, options){
  if (!(this instanceof Sub)) return new Sub(db, path);
  this.parent = db;
  this.path = path;
  this.options = options || {};
};

/**
 * Prefix `key`.
 *
 * @param {String} key
 * @return {String}
 * @api private
 */

Sub.prototype.prefix = function(key){
  return this.path + sep + key;
};

/**
 * Prefixer function factory.
 *
 * @return {Function}
 * @api private
 */

Sub.prototype.prefixer = function(){
  var prefix = this.path + sep;
  return function(key){
    return prefix + key;
  };
};

/**
 * Prefix a range object of `start` and `end`.
 *
 * @param {Object} range
 * @return {Object}
 * @api private
 */

Sub.prototype.prefixRange = function(range){
  range = range || {};
  range.start = this.prefix(range.start || '');
  range.end = this.prefix(range.end || '\xff');
  return range;
};

/**
 * Creates a through stream to remove key prefix
 * from a data object.
 *
 * @return {ReadStream}
 * @api private
 */

Sub.prototype.unprefixReadStream = function(){
  var len = (this.path + sep).length;
  return through(function(data){
    data.key = data.key.substr(len);
    this.queue(data);
  });
};

/**
 * Creates a through stream to remove key prefix.
 *
 * @return {ReadStream}
 * @api private
 */

Sub.prototype.unprefixKeyStream = function(){
  var len = (this.path + sep).length;
  return through(function(key){
    key = key.substr(len);
    this.queue(key);
  });
};

/**
 * Creates a new sublevel under this.
 *
 * @param {String} name
 * @return {Sub}
 * @api public
 */

Sub.prototype.sublevel = function(name){
  return new Sub(this, name);
};

/**
 * Returns a normalized object for
 * `options` and callback `fn`.
 *
 * @param {Object} [options]
 * @param {Function} fn
 * @return {Object}
 * @api private
 */

Sub.prototype.normalize = function(options, fn){
  var args = {};
  if ('function' == typeof options){
    args.options = this.options;
    args.fn = options;
  }
  else {
    args.options = combine(this.options, options);
    args.fn = fn;
  }
  return args;
};

/**
 * Put a `key` and `value` pair into the db.
 *
 * @param {Mixed} key
 * @param {Mixed} value
 * @param {Object} [options]
 * @param {Function} fn
 * @api public
 */

Sub.prototype.put = function(key, value, options, fn){
  var args = this.normalize(options, fn);
  return this.parent.put(this.prefix(key), value, args.options, args.fn);
};

/**
 * Get a `key` from the db.
 *
 * @param {Mixed} key
 * @param {Object} [options]
 * @param {Function} fn
 * @api public
 */

Sub.prototype.get = function(key, options, fn){
  var args = this.normalize(options, fn);
  return this.parent.get(this.prefix(key), args.options, args.fn);
};

/**
 * Delete a `key` from the db.
 *
 * @param {Mixed} key
 * @param {Function} fn
 * @api public
 */

Sub.prototype.del = function(key, fn){
  return this.parent.del(this.prefix(key), fn);
};

/**
 * Creates a ReadStream.
 *
 * @param {Object} [options]
 * @return {ReadStream}
 * @api public
 */

Sub.prototype.createReadStream = function(options){
  this.prefixRange(options);
  var stream = this.parent.createReadStream(options);
  return stream.pipe(this.unprefixReadStream());
};

/**
 * Creates a KeyStream.
 *
 * @param {Object} [options]
 * @return {ReadStream}
 * @api public
 */

Sub.prototype.createKeyStream = function(options){
  this.prefixRange(options);
  var stream = this.parent.createKeyStream(options);
  return stream.pipe(this.unprefixKeyStream());
};

/**
 * Creates a ValueStream.
 *
 * @param {Object} [options]
 * @return {ReadStream}
 * @api public
 */

Sub.prototype.createValueStream = function(options){
  this.prefixRange(options);
  var stream = this.parent.createValueStream(options);
  return stream;
};

/**
 * Creates a WriteStream.
 *
 * @param {Object} [options]
 * @return {ReadStream}
 * @api public
 */

Sub.prototype.createWriteStream = function(options){
  var stream = this.parent.createWriteStream(options);
  var prefix = this.prefixer();
  var write = stream.write;
  stream.write = function(data){
    data.key = prefix(data.key);
    write.call(this, data);
  };
  return stream;
};

/**
 * Combines `a` and `b` into a new object.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 * @api private
 */

function combine(a, b){
  var c = {};
  for (var key in a) c[key] = a[key];
  for (var key in b) c[key] = b[key];
  return c;
}
