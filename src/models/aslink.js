var Base = require('./base'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs');

function AsLink(store, reasoner, id, subject) {
  if (!(this instanceof AsLink))
    return new AsLink(store, reasoner, id, subject);
  Base.call(this, store, reasoner, id, subject);
}
util.inherits(AsLink, Base);
['href', 'rel', 'mediaType', 'displayName', 'title',
 'hreflang', 'height', 'width', 'duration', 'actorOf',
 'attachedTo', 'attributedWith', 'contextOf', 'generatorOf',
 'iconFor', 'imageOf', 'locationOf', 'memberOf', 'objectOf',
 'originOf', 'previewOf', 'providerOf', 'resultOf', 'scopeOf',
 'tagOf', 'targetOf'].forEach(function(key) {
  utils.defineProperty(AsLink.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});

AsLink.Builder = function(reasoner, types, base) {
  if (!(this instanceof AsLink.Builder))
    return new AsLink.Builder(reasoner, types, base);
  Base.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner,vocabs.as.Link,types),
    base || new AsLink(undefined, reasoner));
};
util.inherits(AsLink.Builder, Base.Builder);

['href', 'rel', 'hreflang', 'mediaType', 'actorOf', 'attachedTo', 'attributedWith', 
 'contextOf', 'generatorOf', 'iconFor', 'imageOf', 'locationOf', 'memberOf',
 'objectOf','originOf','previewOf','providerOf','resultOf',
 'scopeOf','tagOf','targetOf'].forEach(function(key) {
  AsLink.Builder.prototype[key] = function(val) {
    this.set(vocabs.as[key], val);
    return this;
  };
});

['displayName', 'title'].forEach(function(key) {
  AsLink.Builder.prototype[key] = function(val, lang) {
    utils.set_lang_val.call(this, vocabs.as[key], val, lang);
    return this;
  };
});

['height', 'width'].forEach(function(key) {
  AsLink.Builder.prototype[key] = function(val) {
    utils.set_non_negative_int.call(this, vocabs.as[key], val);
    return this;
  };
});

['duration'].forEach(function(key) {
  AsLink.Builder.prototype[key] = function(val) {
    utils.set_duration_val.call(this,vocabs.as[key],val);
    return this;
  };
});

module.exports = AsLink;
