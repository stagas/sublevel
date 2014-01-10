
/**
 * Test.
 */

var assert = require('assert');

var level = require('level');
var sublevel = require('../');

var dbpath = __dirname + '/level-test';
var db;

beforeEach(function(done){
  db = level(dbpath, done);
})

afterEach(function(done){
  db.close(function(){
    level.destroy(dbpath, done);
  });
})

describe("sub(db, name, options)", function(){

  it("should return an instance of Sub", function(){
    var sub = sublevel(db, 'items');
    sub.should.be.an.instanceof(sublevel);
  })

  it("should inherit from EventEmitter", function(){
    var sub = sublevel(db, 'items');
    sub.should.be.an.instanceof(require('events').EventEmitter);
  })

  it("should work without path", function(){
    var sub = sublevel(db);
    sub.should.be.an.instanceof(sublevel);
    sub.path.should.equal('\x00/');
  })

  it("should sublevel when no path", function(){
    var sub = sublevel(db);
    var sub2 = sub.sublevel('items');
    sub2.path.should.equal('\x00/\x00items/');
  })

  it("should sublevel a sublevel when no path", function(){
    var sub = sublevel(db);
    var sub2 = sub.sublevel('items');
    var sub3 = sub2.sublevel('posts');
    sub3.path.should.equal('\x00/\x00items/\x00posts/');
  })

  it("should work without path but with options", function(){
    var sub = sublevel(db, { valueEncoding: 'json' });
    sub.should.be.an.instanceof(sublevel);
    sub.path.should.equal('\x00/');
    sub.options.valueEncoding.should.equal('json');
  })

  it("should sublevel a sublevel", function(){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    sub2.should.be.an.instanceof(sublevel);
  })

  it("should pass options", function(done){
    var sub = sublevel(db, 'items', { valueEncoding: 'json' });
    sub.put('foo', { a: 'bar' }, function(err){
      assert(null == err);
      sub.get('foo', function(err, data){
        assert(null == err);
        data.should.eql({ a: 'bar' });
        done();
      });
    });
  })

  it("should find the full path", function(){
    var sub = sublevel(db, 'items');
    sub.path.should.equal('\x00items/');
    var sub2 = sublevel(sub, 'posts');
    sub2.path.should.equal('\x00items/\x00posts/');
    var sub3 = sublevel(sub2, 'comments');
    sub3.path.should.equal('\x00items/\x00posts/\x00comments/');
  })

})

describe("top()", function(){

  it("should return the top level instance", function(){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    var sub3 = sublevel(sub2, 'comments');
    sub3.top().should.equal(db);
  })

})

describe("prefix(key)", function(){

  it("should return a prefixed key", function(){
    var sub = sublevel(db, 'items');
    sub.prefix('foo').should.equal('\x00items/\x01foo');
  })

})

describe("prefixRange(range)", function(){

  it("should prefix start & end range", function(){
    var sub = sublevel(db, 'items');
    sub.prefixRange({
      start: 'foo',
      end: 'foz'
    }).should.eql({
      start: '\x00items/\x01foo',
      end: '\x00items/\x01foz'
    });
  })

  it("should prefix start & end range when end omitted", function(){
    var sub = sublevel(db, 'items');
    sub.prefixRange({
      start: 'foo'
    }).should.eql({
      start: '\x00items/\x01foo',
      end: '\x00items/\x01\xff'
    });
  })

  it("should prefix start & end range when start omitted", function(){
    var sub = sublevel(db, 'items');
    sub.prefixRange({
      end: 'foz'
    }).should.eql({
      start: '\x00items/\x01',
      end: '\x00items/\x01foz'
    });
  })

  it("should prefix start & end range when both omitted", function(){
    var sub = sublevel(db, 'items');
    sub.prefixRange({}).should.eql({
      start: '\x00items/\x01',
      end: '\x00items/\x01\xff'
    });
  })

})

describe("sublevel(name)", function(){

  it("should create a sublevel", function(){
    var sub = sublevel(db, 'items');
    var sub2 = sub.sublevel('posts');
    sub2.prefix('foo').should.equal('\x00items/\x00posts/\x01foo');
  })

  it("should pass options", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sub.sublevel('posts', { valueEncoding: 'json' });
    sub2.put('foo', { a: 'bar' }, function(err){
      assert(null == err);
      sub2.get('foo', function(err, data){
        assert(null == err);
        data.should.eql({ a: 'bar' });
        done();
      });
    });
  })

  it("should combine options", function(done){
    var sub = sublevel(db, 'items', { valueEncoding: 'json' });
    var sub2 = sub.sublevel('posts');
    sub2.put('foo', { a: 'bar' }, function(err){
      assert(null == err);
      sub2.get('foo', function(err, data){
        assert(null == err);
        data.should.eql({ a: 'bar' });
        done();
      });
    });
  })

})

describe("put(key, value, options, fn)", function(){

  it("should put into sublevel", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      db.get('\x00items/\x01foo', function(err, data){
        assert(null == err);
        data.should.equal('bar');
        done();
      });
    });
  })

  it("should pass options", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', { a: 'bar' }, { valueEncoding: 'json' }, function(err){
      assert(null == err);
      db.get('\x00items/\x01foo', { valueEncoding: 'json' }, function(err, data){
        assert(null == err);
        data.should.eql({ a: 'bar' });
        done();
      });
    });
  })

  it("should put into deep sublevel", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    sub2.put('foo', 'bar', function(err){
      assert(null == err);
      db.get('\x00items/\x00posts/\x01foo', function(err, data){
        assert(null == err);
        data.should.equal('bar');
        done();
      });
    });
  })

})

describe("get(key, options, fn)", function(){

  it("should get from sublevel", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.get('foo', function(err, data){
        assert(null == err);
        data.should.equal('bar');
        done();
      });
    });
  })

  it("should pass options", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', { a: 'bar' }, { valueEncoding: 'json' }, function(err){
      assert(null == err);
      db.get('\x00items/\x01foo', { valueEncoding: 'json' }, function(err, data){
        assert(null == err);
        data.should.eql({ a: 'bar' });
        done();
      });
    });
  })

  it("should get from deep sublevel", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    sub2.put('foo', 'bar', function(err){
      assert(null == err);
      sub2.get('foo', function(err, data){
        assert(null == err);
        data.should.equal('bar');
        done();
      });
    });
  })

})

describe("del(key, fn)", function(){

  it("should del from sublevel", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.del('foo', function(err){
        assert(null == err);
        sub.get('foo', function(err, data){
          err.type.should.equal('NotFoundError');
          done();
        });
      });
    });
  })

  it("should accept options", function(done){
    var sub = sublevel(db, 'items');
    var opts = { keyEncoding: 'json' };
    sub.put({ foo: 'bar' }, 'bar', opts, function(err){
      assert(null == err);
      sub.get({ foo: 'bar' }, opts, function(err, data){
        assert(null == err);
        data.should.equal('bar');
        sub.del({ foo: 'bar' }, opts, function(err){
          assert(null == err);
          sub.get({ foo: 'bar' }, opts, function(err, data){
            err.type.should.equal('NotFoundError');
            done();
          });
        });
      });
    });
  })

  it("should del from deep sublevel", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    sub2.put('foo', 'bar', function(err){
      assert(null == err);
      sub2.del('foo', function(err){
        assert(null == err);
        sub2.get('foo', function(err, data){
          err.type.should.equal('NotFoundError');
          done();
        });
      });
    });
  })

})

describe("batch(ops)", function(){

  it("should execute batch operations", function(done){
    var sub = sublevel(db, 'items');
    sub.batch([
      { type: 'put', key: 'foo', value: 'bar' },
      { type: 'put', key: 'foz', value: 'baz' },
      { type: 'put', key: 'delete', value: 'me' },
      { type: 'del', key: 'delete' }
    ], function(err){
      var stream = sub.createReadStream();
      var results = [];
      stream.on('data', function(data){
        results.push(data);
      });
      stream.on('end', function(){
        results.should.eql([
          { key: 'foo', value: 'bar' },
          { key: 'foz', value: 'baz' }
        ]);
        done();
      });
    });
  })

  it("should execute batch operations across sublevels", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(db, 'users');
    sub.batch([
      { type: 'put', key: 'foo', value: 'bar' },
      { type: 'put', key: 'foz', value: 'baz', prefix: sub2 },
      { type: 'put', key: 'delete', value: 'me' },
      { type: 'del', key: 'delete' }
    ], function(err){
      var stream = sub.createReadStream();
      var results = [];
      stream.on('data', function(data){
        results.push(data);
      });
      stream.on('end', function(){
        results.should.eql([
          { key: 'foo', value: 'bar' }
        ]);
        var stream = sub2.createReadStream();
        results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            { key: 'foz', value: 'baz' }
          ]);
          done();
        });
      });
    });
  })

  it("should execute fluent api batch operations", function(done){
    var sub = sublevel(db, 'items');
    sub.batch()
    .put('foo', 'bar')
    .put('foz', 'baz')
    .put('delete', 'me')
    .del('delete')
    .write(function(err){
      var stream = sub.createReadStream();
      var results = [];
      stream.on('data', function(data){
        results.push(data);
      });
      stream.on('end', function(){
        results.should.eql([
          { key: 'foo', value: 'bar' },
          { key: 'foz', value: 'baz' }
        ]);
        done();
      });
    });
  })

})

describe("createReadStream(params)", function(){

  it("should create a ReadStream in sublevel", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub.createReadStream();
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            { key: 'foo', value: 'bar' },
            { key: 'foz', value: 'baz' }
          ]);
          done();
        });
      });
    });
  })

  it("should use sublevel options", function(done){
    var sub = sublevel(db, 'items', { valueEncoding: 'json' });
    sub.put('foo', { bar: 'bar' }, function(err){
      assert(null == err);
      sub.put('foz', { baz: 'baz' }, function(err){
        assert(null == err);
        var stream = sub.createReadStream();
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            { key: 'foo', value: { bar: 'bar' } },
            { key: 'foz', value: { baz: 'baz' } }
          ]);
          done();
        });
      });
    });
  })

  it("should work with `reverse: true`", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub.createReadStream({ reverse: true });
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            { key: 'foz', value: 'baz' },
            { key: 'foo', value: 'bar' }
          ]);
          done();
        });
      });
    });
  })

  it("should only ReadStream from this sublevel", function(done){
    var sub = sublevel(db, 'items');
    db.put('not', 'this', function(err){
      assert(null == err);
      sub.put('foo', 'bar', function(err){
        assert(null == err);
        sub.put('foz', 'baz', function(err){
          assert(null == err);
          var stream = sub.createReadStream();
          var results = [];
          stream.on('data', function(data){
            results.push(data);
          });
          stream.on('end', function(){
            results.should.eql([
              { key: 'foo', value: 'bar' },
              { key: 'foz', value: 'baz' }
            ]);
            done();
          });
        });
      });
    });
  })

  it("should handle start range", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub.createReadStream({ start: 'fop' });
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            { key: 'foz', value: 'baz' }
          ]);
          done();
        });
      });
    });
  })

  it("should handle end range", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub.createReadStream({ end: 'fop' });
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            { key: 'foo', value: 'bar' }
          ]);
          done();
        });
      });
    });
  })

  it("should handle both ranges", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.put('fop', 'bap', function(err){
        assert(null == err);
        sub.put('foz', 'baz', function(err){
          assert(null == err);
          var stream = sub.createReadStream({ start: 'fop', end: 'foq' });
          var results = [];
          stream.on('data', function(data){
            results.push(data);
          });
          stream.on('end', function(){
            results.should.eql([
              { key: 'fop', value: 'bap' }
            ]);
            done();
          });
        });
      });
    });
  })

  it("should create a ReadStream in deep sublevel", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    sub2.put('foo', 'bar', function(err){
      assert(null == err);
      sub2.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub2.createReadStream();
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            { key: 'foo', value: 'bar' },
            { key: 'foz', value: 'baz' }
          ]);
          done();
        });
      });
    });
  })

  it("creating ReadStream on parent should not read sublevel's", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub2.put('not', 'this', function(err){
        assert(null == err);
        var stream = sub.createReadStream();
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            { key: 'foo', value: 'bar' }
          ]);
          done();
        });
      });
    });
  })

})

describe("createKeyStream(params)", function(){

  it("should create a KeyStream in sublevel", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub.createKeyStream();
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            'foo',
            'foz'
          ]);
          done();
        });
      });
    });
  })

  it("should create a KeyStream in deep sublevel", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    sub2.put('foo', 'bar', function(err){
      assert(null == err);
      sub2.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub2.createKeyStream();
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            'foo',
            'foz'
          ]);
          done();
        });
      });
    });
  })

})

describe("createValueStream(params)", function(){

  it("should create a ValueStream in sublevel", function(done){
    var sub = sublevel(db, 'items');
    sub.put('foo', 'bar', function(err){
      assert(null == err);
      sub.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub.createValueStream();
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            'bar',
            'baz'
          ]);
          done();
        });
      });
    });
  })

  it("should create a ValueStream in deep sublevel", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'posts');
    sub2.put('foo', 'bar', function(err){
      assert(null == err);
      sub2.put('foz', 'baz', function(err){
        assert(null == err);
        var stream = sub2.createValueStream();
        var results = [];
        stream.on('data', function(data){
          results.push(data);
        });
        stream.on('end', function(){
          results.should.eql([
            'bar',
            'baz'
          ]);
          done();
        });
      });
    });
  })

})

describe("createWriteStream(params)", function(){

  it("should create a WriteStream in sublevel", function(done){
    var sub = sublevel(db, 'items');
    var ws = sub.createWriteStream();
    ws.end({ key: 'foo', value: 'bar' });
    ws.on('close', function(){
      var stream = sub.createReadStream();
      var results = [];
      stream.on('data', function(data){
        results.push(data);
      });
      stream.on('end', function(){
        results.should.eql([
          { key: 'foo', value: 'bar' }
        ]);
        done();
      });
    });
  })

  it("should create a WriteStream in deep sublevel", function(done){
    var sub = sublevel(db, 'items');
    var sub2 = sublevel(sub, 'items');
    var ws = sub2.createWriteStream();
    ws.end({ key: 'foo', value: 'bar' });
    ws.on('close', function(){
      var stream = sub2.createReadStream();
      var results = [];
      stream.on('data', function(data){
        results.push(data);
      });
      stream.on('end', function(){
        results.should.eql([
          { key: 'foo', value: 'bar' }
        ]);
        done();
      });
    });
  })

})
