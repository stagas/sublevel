
/*!
 *
 * sublevel
 *
 * sublevels for levelup
 *
 * MIT
 *
 */

/**
 * Module dependencies.
 */

var fix = require('level-fix-range');
var extend = require('xtend');
var through = require('through');
var Emitter = require('events').EventEmitter;
var inherits = require('util').inherits;

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
 * @param {LevelUP|Sub} db
 * @param {String} [path]
 * @param {Object} [options]
 * @api public
 */

function Sub(db, path, options){
  if (!(this instanceof Sub)) return new Sub(db, path, options);
  if ('object' == typeof path) {
    options = path;
    path = '';
  }
  this.parent = db;
  this.db = this.top();
  this.path = this.pathJoin('\x00' + (path || ''));
  this.options = options || {};
}

/**
 * Make Emitter.
 */

inherits(Sub, Emitter);

/**
 * Gets topmost db instance.
 *
 * @return {LevelUP}
 * @api private
 */

Sub.prototype.top = function(){
  if (this.parent.top) {
    return this.parent.top();
  }
  else {
    return this.parent;
  }
};

/**
 * Join `path` with parent's when sublevel.
 *
 * @param {String} path
 * @return {String}
 */

Sub.prototype.pathJoin = function(path){
  if (this.parent.path) {
    return this.parent.path + path + sep;
  }
  else {
    return path + sep;
  }
};

/**
 * Prefix `key`.
 *
 * @param {String} key
 * @return {String}
 * @api private
 */

Sub.prototype.prefix = function(key){
  return this.path + '\x01' + key;
};

/**
 * Prefixer function factory.
 *
 * @return {Function}
 * @api private
 */

Sub.prototype.prefixer = function(){
  var prefix = this.path + '\x01';
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
  return fix(range);
};

/**
 * Creates a through stream to remove key prefix
 * from a data object.
 *
 * @return {ReadStream}
 * @api private
 */

Sub.prototype.unprefixReadStream = function(){
  var len = this.path.length + 1;
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
  var len = this.path.length + 1;
  return through(function(key){
    key = key.substr(len);
    this.queue(key);
  });
};

/**
 * Creates a new sublevel under this.
 *
 * @param {String} name
 * @param {Object} [options]
 * @return {Sub}
 * @api public
 */

Sub.prototype.sublevel = function(name, options){
  return new Sub(this, name, extend(this.options, options));
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
    args.options = extend(this.options, options);
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
  return this.db.put(this.prefix(key), value, args.options, args.fn);
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
  return this.db.get(this.prefix(key), args.options, args.fn);
};

/**
 * Delete a `key` from the db.
 *
 * @param {Mixed} key
 * @param {Object} [options]
 * @param {Function} fn
 * @api public
 */

Sub.prototype.del = function(key, options, fn){
  var args = this.normalize(options, fn);
  return this.db.del(this.prefix(key), args.options, args.fn);
};

/**
 * Create batch operations `ops`.
 *
 * Borrowed from https://github.com/juliangruber/level-prefix
 *
 * @param {Array} ops
 * @param {Object} options
 * @param {Function} fn
 * @return {Object}
 * @api public
 */

Sub.prototype.batch = function(ops, options, fn){
  if (!arguments.length) {
    return this.decorateChainedBatch(this.db.batch());
  }

  var args = this.normalize(options, fn);
  var prefix = this.prefixer();

  ops.forEach(function(op){
    op.key = op.prefix
      ? op.prefix.prefix(op.key)
      : prefix(op.key);
  });

  this.db.batch(ops, args.options, args.fn);
};

/**
 * Decorate chained batch
 *
 * Borrowed from https://github.com/juliangruber/level-prefix
 *
 * @param {Object} batch
 * @api private
 */

Sub.prototype.decorateChainedBatch = function(batch){
  var prefix = this.prefixer();
  var methods = ['put', 'del'];

  methods.forEach(function(method){
    var original = batch[method];

    batch[method] = function(){
      var args = [].slice.call(arguments);
      args[0] = prefix(args[0]);
      return original.apply(batch, args);
    };
  });

  return batch;
};

/**
 * Creates a ReadStream.
 *
 * @param {Object} [options]
 * @return {ReadStream}
 * @api public
 */

Sub.prototype.createReadStream = function(options){
  options = this.prefixRange(options);
  options = extend(this.options, options);
  var stream = this.db.createReadStream(options);
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
  options = this.prefixRange(options);
  options = extend(this.options, options);
  var stream = this.db.createKeyStream(options);
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
  options = this.prefixRange(options);
  options = extend(this.options, options);
  var stream = this.db.createValueStream(options);
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
  options = extend(this.options, options);
  var stream = this.db.createWriteStream(options);
  var prefix = this.prefixer();
  var write = stream.write;
  stream.write = function(data){
    data.key = prefix(data.key);
    write.call(this, data);
  };
  return stream;
};
