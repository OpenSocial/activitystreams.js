var Base = require('./base'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs');

function AsObject(store, reasoner, id, subject) {
  if (!(this instanceof AsObject))
    return new AsObject(store, reasoner, id, subject);
  Base.call(this, store, reasoner, id, subject);
}
util.inherits(AsObject, Base);
['alias', 'attachedTo', 'attachment', 'attributedTo',
 'attributedWith', 'content', 'context', 'contextOf',
 'displayName', 'endTime', 'generator', 'generatorOf',
 'icon', 'image', 'inReplyTo', 'memberOf', 'location',
 'locationOf', 'objectOf', 'originOf', 'preview', 
 'previewOf', 'published', 'rating', 'resultOf', 
 'replies', 'scope', 'scopeOf', 'startTime', 'summary',
 'tag', 'tagOf', 'targetOf', 'title', 'updated', 'url'].forEach(function(key) {
  utils.defineProperty(AsObject.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});

AsObject.Builder = function(reasoner, types, base) {
  if (!(this instanceof AsObject.Builder))
    return new AsObject.Builder(reasoner,types,base);
  Base.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner,vocabs.as.Object,types),
    base || new AsObject(undefined, reasoner));
};
util.inherits(AsObject.Builder, Base.Builder);

['alias', 'attachedTo', 'attachment', 'attributedTo',
 'attributedWith', 'context', 'contextOf', 'generator',
 'generatorOf', 'icon', 'image', 'inReplyTo', 'memberOf',
 'location', 'locationOf', 'originOf', 'objectOf', 'preview',
 'previewOf', 'provider', 'providerOf', 'resultOf', 'replies',
 'scope', 'scopeOf', 'tag', 'tagOf', 'targetOf', 'url'].forEach(function(key) {
   AsObject.Builder.prototype[key] = function(val) {
     this.set(vocabs.as[key], val);
     return this;
   };
});
['content', 'displayName', 'summary', 'title'].forEach(function(key) {
  AsObject.Builder.prototype[key] = function(val, lang) {
    utils.set_lang_val.call(this, vocabs.as[key], val, lang);
    return this;
  };
});
['endTime','published','startTime','updated'].forEach(function(key) {
  AsObject.Builder.prototype[key] = function(val) {
    utils.set_date_val.call(this,vocabs.as[key],val);
    return this;
  };
  AsObject.Builder.prototype[key + 'Now'] = function() {
    return this[key](new Date());
  };
});

AsObject.Builder.prototype.rating = function(val) {
  utils.set_ranged_val.call(this, vocabs.as.rating, val, 0.0, 5.0, vocabs.xsd.float);
  return this;
};

module.exports = AsObject;