# Activity Streams 2.0 JavaScript Reference Implementation

## Getting Started

### Building

Use "grunt" to build.

### Installation

#### Using Bower

TODO

#### Using NPM

TODO 

### Usage

The Activity Streams Objects are generated as wrappers around an n3 in-memory store.
These wrappers understand the Activity Streams 2.0 model and make it possible to work with
Activity Streams objects in a consistent way with integrated type checking.

```javascript
var as = require('activitystreams');

// Create a simple object
as.object().
  displayName('baz').
  content('bar', 'en').
  content('foo', 'fr').
  publishedNow().
  rating(2.5).
  get().
  prettyWrite(function(err,doc) {
    console.log(doc);
  });

// Create a simple activity
as.post().
  actor('acct:sally@example.org').
  object('http://www.example.org/post').
  get().
  prettyWrite(function(err,doc) {
    console.log(doc);
  });
```

The API uses a fluent factory pattern for creating AS objects. There are factory
methods for each of the main types of objects defined by the Activity Streams 2.0
vocabulary. Each takes an optional array of types that will be set on the object.
If the `[types]` is unspecified, a default will be assigned depending on the 
object being created. Each of the factory methods returns a builder specific to 
the kind of object being generated. Once the object has been built, call the `get`
method to return the generated object.

* `as.object([types])`
* `as.actor([types])` 
* `as.activity([types])`  
* `as.collection([types])`  
* `as.orderedCollection([types])`  
* `as.content([types])`  
* `as.link([types])`  
* `as.accept([types])`  
* `as.tentativeAccept([types])`  
* `as.add([types])`  
* `as.arrive([types])`  
* `as.create([types])`  
* `as.delete([types])`  
* `as.favorite([types])`  
* `as.follow([types])`  
* `as.ignore([types])`  
* `as.join([types])`  
* `as.leave([types])`  
* `as.like([types])`  
* `as.offer([types])`  
* `as.connect([types])`  
* `as.friendRequest([types])`  
* `as.give([types])`  
* `as.invite([types])`  
* `as.post([types])`  
* `as.reject([types])`  
* `as.tentativeReject([types])`  
* `as.remove([types])`  
* `as.review([types])`  
* `as.save([types])`  
* `as.share([types])`  
* `as.undo([types])`  
* `as.update([types])`  
* `as.experience([types])`  
* `as.view([types])`  
* `as.watch([types])`  
* `as.listen([types])`  
* `as.read([types])`  
* `as.respond([types])`  
* `as.move([types])`  
* `as.travel([types])`  
* `as.announce([types])`  
* `as.block([types])`  
* `as.flag([types])`  
* `as.dislike([types])`  
* `as.confirm([types])`  
* `as.assign([types])`  
* `as.complete([types])`  
* `as.achieve([types])`  
* `as.application([types])`  
* `as.content([types])`  
* `as.device([types])`  
* `as.group([types])`  
* `as.organization([types])`  
* `as.person([types])`  
* `as.process([types])`  
* `as.role([types])`  
* `as.service([types])`  
* `as.article([types])`  
* `as.album([types])`  
* `as.folder([types])`  
* `as.story([types])`  
* `as.document([types])`  
* `as.audio([types])`  
* `as.image([types])`  
* `as.video([types])`  
* `as.note([types])`  
* `as.page([types])`  
* `as.possibleAnswer([types])`  
* `as.question([types])`  
* `as.event([types])`  
* `as.place([types])`  
* `as.reservation([types])`  
* `as.mention([types])`  

The object returned by `get` is a read-only view of the Activity Stream object. It will have property methods that are specific to the object's type. You can export the built object as an ordinary Javascript object using the `export` method. This will generate a JSON-LD compliant Javascript object.

```javascript
var as = require('activitystreams');

as.note().
   displayName('foo').
   content('this is a simple note').
   get().
   export(function (err, obj) {
     // obj is an ordinary javascript object
     console.log(obj['@type']);
     console.log(obj['displayName']);
     console.log(obj['content']);
   });
```

To serialize the Activity Streams object out as JSON, use the `write` or `prettyWrite` methods.

```javascript
var as = require('activitystreams');

as.note().
   displayName('foo').
   content('this is a simple note').
   get().
   write(function (err, doc) {
     // doc is a string
     console.log(doc);
   });
```

```javascript
var as = require('activitystreams');

as.note().
   displayName('foo').
   content('this is a simple note').
   get().
   prettyWrite(function (err, doc) {
     // doc is a string
     console.log(doc);
   });
```

Note that The `export`, `write`, and `prettyWrite` methods are all async. You MUST pass in a callback function. This is largely because of the JSON-LD processing that's happening under the covers.

