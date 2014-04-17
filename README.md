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

The Activity Streams Objects are generated as wrappers around vanilla JavaScript objects.
These wrappers understand the Activity Streams 2.0 model and make it possible to work with
Activity Streams objects in a consistent way with integrated type checking.

HTML:
```html
<html>
<head>
  <script src="js/activitystreams.min.js"></script>
  <script>
    var activity = asms.Activity({
      verb: 'post',
      actor: {
        displayName: 'Joe',
        id: 'acct:joe@example.org'
      },
      object: {
        objectType: 'note',
        content: 'This is a short note'
      },
      updated: new Date()
    });

    console.log(activity.verb.id);
    console.log(activity.actor.displayName);
    console.log(activity.object.objectType.id);
    console.log(activity.object.content['*']);

    console.log(activity.toString()); // output json
  </script>
</head>
</html>
```

Node.js:
```javascript
var asms = require('activitystreams');
var activity = asms.Activity({
  verb: 'post',
  actor: {
    displayName: 'Joe',
    id: 'acct:joe@example.org'
  },
  object: {
    objectType: 'note',
    content: 'This is a short note'
  },
  updated: new Date()
});

console.log(activity.verb.id);
console.log(activity.actor.displayName);
console.log(activity.object.objectType.id);
console.log(activity.object.content['*']);

console.log(activity.toString()); // output json
```

### Tasks

#### Creating a simple Object

```javascript
var obj = asms.Object({
  objectType: 'note',
  content: 'This is a note'
  id: 'urn:example:notes:1',
  published: new Date()
});
```

#### Creating a simple Activity

```javascript
var obj = asms.Activity({
  verb: 'post',
  actor: 'acct:joe@example.org',
  object: 'http://example.org/notes/1'
});
```

#### Creating a simple Collection

```javascript
var col = asms.Collection({
  totalItems: 1,
  items: [
    {
      objectType: 'note',
      content: 'This is a note'
      id: 'urn:example:notes:1',
      published: new Date()
    }
  ]
});
```

#### Extending objects with Mixin Models

Models allow Activity Stream objects to be dynamically extended while enforcing the
type safety and wrapper mechanisms. For example, the Model.Ext.Mood model tells the 
wrapper to treat 'mood' properties on the vanilla object as Activity Stream Type Values.

```javascript
var m = asms.Object({mood:'happy'});

console.log(m.mood); // undefined

m = m.extended(asms.Models.Ext.Mood);

console.log(m.mood.id); // 'happy'
```
#### Extending base Models

The base Models can be extended by adding new type specific properties. These will 
be applied to all new Activity Stream objects (existing objects will be unaffected).

```javascript
asms.Models.Object.boolean('foo',undefined,true);

var obj = asms.Object({});
console.log(obj.foo); // 'true'
```

#### Creating new Models

You can create new models by extending existing ones.

```javascript
var myModel = asms.Models.Base.extend().
  property('foo').
  nlv('bar');
```

## Reference

### API

TBD
