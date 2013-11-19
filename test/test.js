
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

})

describe("prefix(key)", function(){

  it("should return a prefixed key", function(){
    var sub = sublevel(db, 'items');
    sub.prefix('foo').should.equal('items/foo');
  })

})

describe("prefixRange(range)", function(){

  it("should prefix start & end range", function(){
    var sub = sublevel(db, 'items');
    sub.prefixRange({
      start: 'foo',
      end: 'foz'
    }).should.eql({
      start: 'items/foo',
      end: 'items/foz'
    });
  })

  it("should prefix start & end range when end omitted", function(){
    var sub = sublevel(db, 'items');
    sub.prefixRange({
      start: 'foo'
    }).should.eql({
      start: 'items/foo',
      end: 'items/\xff'
    });
  })

  it("should prefix start & end range when start omitted", function(){
    var sub = sublevel(db, 'items');
    sub.prefixRange({
      end: 'foz'
    }).should.eql({
      start: 'items/',
      end: 'items/foz'
    });
  })

  it("should prefix start & end range when both omitted", function(){
    var sub = sublevel(db, 'items');
    sub.prefixRange({}).should.eql({
      start: 'items/',
      end: 'items/\xff'
    });
  })

})

describe("sublevel(name)", function(){

  it("should create a sublevel", function(){
    var sub = sublevel(db, 'items');
    var sub2 = sub.sublevel('posts');
    sub2.prefix('foo').should.equal('posts/foo');
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
      db.get('items/foo', function(err, data){
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
      db.get('items/foo', { valueEncoding: 'json' }, function(err, data){
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
      db.get('items/posts/foo', function(err, data){
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
      db.get('items/foo', { valueEncoding: 'json' }, function(err, data){
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

  it("should only ReadStream from this sublevel", function(done){
    var sub = sublevel(db, 'items');
    db.put('not', 'this', function(err){
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
