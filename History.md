
2.4.0 / 09-01-2014
==================

- Make Emitter.

2.3.0 / 06-12-2013
==================

- `del()` accepts options.

2.2.1 / 05-12-2013
==================

- Fix `reverse: true`.
- Range streams now use sublevel options.

2.2.0 / 02-12-2013
==================

- Support `prefix` in `.batch(ops)` for batch operations
across sublevels.

2.1.0 / 30-11-2013
==================

- Add `.batch()`. Implementation borrowed
from https://github.com/juliangruber/level-prefix

2.0.0 / 21-11-2013
==================

- Prefix keys to distinguish from sublevels.

1.0.0 / 21-11-2013
==================

- Hide sublevels from parent ReadStream.

0.3.1 / 19-11-2013
==================

- Correct path generation. Fixes issue when initializing
without path.

0.3.0 / 19-11-2013
==================

- Make path argument optional.

0.2.0 / 19-11-2013
==================

- Don't recurse methods, use topmost db.

0.1.0 / 18-11-2013
==================

- Pass options to `.sublevel()`.

0.0.3 / 18-11-2013
==================

- Pass options to constructor without using new.

0.0.2 / 18-11-2013
==================

- Prefix options when omitted in *Stream.

0.0.1 / 18-11-2013
==================

- First release.
