var AsObject = require('./asobject'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs');

function AsActivity(store, reasoner, id, subject) {
  if (!(this instanceof AsActivity))
    return new AsActivity(store, reasoner, id, subject);
  AsObject.call(this, store, reasoner, id, subject);
}
util.inherits(AsActivity, AsObject);
['actor','object','target',
 'result','origin','priority',
 'to','bto','cc','bcc'].forEach(function(key) {
  utils.defineProperty(AsActivity.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});

AsActivity.Builder = function(reasoner, types, base) {
  if (!(this instanceof AsActivity.Builder))
    return new AsActivity.Builder(reasoner, types, base);
  AsObject.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner,vocabs.as.Activity, types), 
    base || new AsActivity(undefined, reasoner));
};
util.inherits(AsActivity.Builder, AsObject.Builder);

['actor','object','target','result','origin',
 'to','bto','cc','bcc'].forEach(function(key) {
  AsActivity.Builder.prototype[key] = function(val) {
    this.set(vocabs.as[key], val);
    return this;
  };
});

AsActivity.Builder.prototype.priority = function(val) {
  utils.set_ranged_val.call(this, vocabs.as.priority, val, 0.0, 1.0, vocabs.xsd.float);
  return this;
};

module.exports = AsActivity;
