var assert = require('assert'),
    vocabs = require('../src/vocabs'),
    models = require('../src/models'),
    as = require('../src/activitystreams');

  // Test Basic Object Creation
  var object = as.object().get();
  assert.equal(object.type, vocabs.as.Object);

  var now = new Date();

  // Test Functional and Language Properties
  object = as.object()
    .alias('http://example.org/foo')
    .content('bar', 'en')
    .content('foo', 'fr')
    .displayName('baz', 'de')
    .summary('bar', 'sp')
    .title('foo', 'it')
    .endTime(now)
    .startTime(now)
    .published(now)
    .updated(now)
    .rating(2.5)
    .get();

  function testFunctionalProperties(object) {
    assert.equal(object.alias, 'http://example.org/foo');
    assert.equal(object.content['*'], 'bar');
    assert.equal(object.content.fr, 'foo');
    assert.equal(object.displayName.de, 'baz');
    assert.equal(object.summary.sp, 'bar');
    assert.equal(object.title.it, 'foo');
    assert.equal(object.endTime.toISOString(), now.toISOString());
    assert.equal(object.startTime.toISOString(), now.toISOString());
    assert.equal(object.published.toISOString(), now.toISOString());
    assert.equal(object.updated.toISOString(), now.toISOString());
    assert.equal(object.rating, 2.5);
  }
  testFunctionalProperties(object);

  // Test roundtrip
  object.export(function(e,d) {
    assert.equal(e, null);
    as.import(d, function(e,d) {
      testFunctionalProperties(d);
    });
  });

  assert(as.object().get() instanceof models.Object);
  assert(as.actor().get() instanceof models.Actor);
  assert(as.activity().get() instanceof models.Activity);
  assert(as.collection().get() instanceof models.Collection);
  assert(as.orderedCollection().get() instanceof models.OrderedCollection);
  assert(as.content().get() instanceof models.Content);
  assert(as.link().get() instanceof models.Link);

  // Quick test on the various constructor methods
  ['accept', 'tentativeAccept', 'add', 'arrive',
   'create', 'delete', 'favorite', 'follow', 'ignore',
   'join', 'leave', 'like', 'offer', 'connect', 'friendRequest',
   'give', 'invite', 'post', 'reject', 'tentativeReject',
   'remove', 'review', 'save', 'share', 'undo', 'update',
   'experience', 'view', 'watch', 'listen', 'read', 'respond',
   'move', 'travel', 'announce', 'block', 'flag', 'dislike',
   'confirm', 'assign', 'complete', 'achieve', 'reservation'].forEach(function(key) {
    var obj = as[key]().get();
    assert(obj instanceof models.Activity);
  });

  ['application', 'content', 'device', 'group',
   'organization', 'person', 'process', 'role',
   'service', 'article', 'document', 'audio',
   'image', 'video', 'note', 'page', 'possibleAnswer',
   'question', 'event', 'place'].forEach(function(key) {
    var obj = as[key]().get();
    assert(obj instanceof models.Object);
  });

  ['album', 'folder', 'story'].forEach(function(key) {
    var obj = as[key]().get();
    assert(obj instanceof models.Collection);
  });

  ['mention'].forEach(function(key) {
    var obj = as[key]().get();
    assert(obj instanceof models.Link);
  });
  
  // Test complex creation
  obj =
    as.post()
      .actor('acct:joe@example.org')
      .object(as.note().content('this is a note'))
      .get();

  assert.equal(1, obj.actor.length);
  var actor = obj.actor[0];
  assert.equal('acct:joe@example.org', actor.id);
  assert(actor instanceof models.Object);

  assert.equal(1, obj.object.length);
  var note = obj.object[0];
  assert.equal(vocabs.as.Note, note.type);
  assert.equal(note.content['*'], 'this is a note');

  // Test importing from JSON
  as.import({
    '@type': 'Reservation',
    displayNameMap: {
      en: 'foo'
    },
    actor: {
      '@type': 'Person',
      displayName: 'Joe'
    },
    object: {
      '@type': 'http://example.org/Table',
      displayName: 'Table'
    }
  }, function(err, doc) {
    assert.equal(null, err);
    assert.equal(vocabs.as.Reservation, doc.type);
    assert.equal(doc.displayName.en, 'foo');
    assert.equal(vocabs.as.Person, doc.actor[0].type);
    assert.equal(doc.actor[0].displayName['*'], 'Joe');
  });
