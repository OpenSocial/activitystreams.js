var AsObject = require('./asobject'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs');

function AsActor(store, reasoner, id, subject) {
  if (!(this instanceof AsActor))
    return new AsActor(store, reasoner, id, subject);
  AsObject.call(this, store, reasoner, id, subject);
}
util.inherits(AsActor, AsObject);
['actorOf'].forEach(function(key) {
  utils.defineProperty(AsActor.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});

AsActor.Builder = function(reasoner, types, base) {
  if (!(this instanceof AsActor.Builder))
    return new AsActor.Builder(reasoner, types, base);
  AsObject.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner,vocabs.as.Actor,types), 
    base || new AsActor(undefined,reasoner));
};
util.inherits(AsActor.Builder, AsObject.Builder);

['actorOf'].forEach(function(key) {
  AsActor.Builder.prototype[key] = function(val) {
    this.set(vocabs.as[key], val);
    return this;
  };
});

module.exports = AsActor;