
/**
 * Example.
 */

var level = require('level');
var sublevel = require('./');

// create a sublevel by passing a level `db` instance
var db = level('./level-test');
var items = sublevel(db, 'items');

items.put('foo', 'bar', function(err){
  items.get('foo', function(err, data){
    console.log(data); // => 'bar'
  });
});

// create deeper sublevels by passing the parent
var posts = sublevel(items, 'posts');

// or alternatively by calling `.sublevel()`
var comments = posts.sublevel('comments');
