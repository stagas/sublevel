
# sublevel

sublevels for levelup

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

`put`, `get`, `del`, `batch`, `createReadStream`, `createKeyStream`, `createValueStream`, `createWriteStream`

### Sub(db[, path][, options])

Creates a new sublevel under `db`.

### Sub#sublevel(path[, options])

Creates a new sublevel under this.

## License

MIT
