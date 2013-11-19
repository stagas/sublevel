
# sublevel

sublevels for levelup without the complexity

## Installation

`npm install sublevel`

## Example

```js
var level = require('level');
var sublevel = require('sublevel');

// create a sublevel by passing a level `db` instance
var db = level('/tmp/level');
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
```

## API

The following methods are compatible with a `level` db:

`put`, `get`, `del`, `createReadStream`, `createKeyStream`, `createValueStream`, `createWriteStream`

### Sub#sublevel(name)

Creates a new sublevel.

## License

MIT
