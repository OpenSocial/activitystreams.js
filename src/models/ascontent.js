var AsObject = require('./asobject'),
    util = require('util'),
    utils = require('../utils');
    vocabs = require('../vocabs');

function AsContent(store, reasoner, id, subject) {
  if (!(this instanceof AsContent))
    return new AsContent(store, reasoner, id, subject);
  AsObject.call(this, store, reasoner, id, subject);
}
util.inherits(AsContent, AsObject);
['height','width','duration'].forEach(function(key) {
  utils.defineProperty(AsContent.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});

AsContent.Builder = function(reasoner,types, base) {
  if (!(this instanceof AsContent.Builder))
    return new AsContent.Builder(reasoner, types, base);
  AsObject.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner,vocabs.as.Content, types),
    base || new AsContent(undefined, reasoner));
};
util.inherits(AsContent.Builder, AsObject.Builder);

['height','width'].forEach(function(key) {
  AsContent.Builder.prototype[key] = function(val) {
    utils.set_non_negative_int.call(this, vocabs.as[key], val);
    return this;
  };
});
['duration'].forEach(function(key) {
  AsContent.Builder.prototype[key] = function(val) {
    utils.set_duration_val.call(this, vocabs.as[key], val);
    return this;
  };
});

module.exports = AsContent;
