  var AsCollection = require('./ascollection'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs'),
    models = require('../models');

  function AsOrderedCollection(store, reasoner, id, subject) {
    if (!(this instanceof AsOrderedCollection))
      return new AsOrderedCollection(store, reasoner, id, subject);
    AsCollection.call(this,store,reasoner,subject,id);
  }
  util.inherits(AsOrderedCollection, AsCollection);

  AsOrderedCollection.Builder = function(reasoner, types, base) {
    if (!(this instanceof AsOrderedCollection.Builder))
      return new AsOrderedCollection.Builder(reasoner, types, base);
    AsCollection.Builder.call(
      this, 
      reasoner, 
      utils.merge_types(reasoner, vocabs.as.OrderedCollection, types),
      base || new AsOrderedCollection(undefined, reasoner));
  };
  util.inherits(AsOrderedCollection.Builder, AsCollection.Builder);
  AsOrderedCollection.Builder.prototype.items = function(val) {
    return this.orderedItems.apply(this,arguments);
  };
  AsOrderedCollection.Builder.prototype.startIndex = function(val) {
    utils.set_non_negative_int.call(this, as.startIndex, val);
    return this;
  };

  module.exports = AsOrderedCollection;