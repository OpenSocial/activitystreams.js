var AsObject = require('./asobject'),
    Base = require('./base'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs'),
    models = require('../models');

function is_ordered(base) {
  var i = base.get(vocabs.as.items);
  if (i.length === 0)
    return false;
  if (i[0].get(vocabs.rdf.first) !== undefined)
    return true;
  else 
    return false;
}

function AsCollection(store, reasoner, id, subject) {
  if (!(this instanceof AsCollection))
    return new AsCollection(store, reasoner, id, subject);
  AsObject.call(this, store, reasoner, id, subject);
  utils.defineHidden(this, 'ordered', is_ordered(this));
}
util.inherits(AsCollection, AsObject);
['totalItems','itemsPerPage','current','next','prev',
 'last','first','self'].forEach(function(key) {
  utils.defineProperty(AsCollection.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});
utils.defineProperty(AsCollection.prototype, 'items', function() {
  var i = this.get(vocabs.as.items);
  if (this.ordered) {
    var current = i[0];
    var ret = [];
    while(true) {
      ret.push(current.get(vocabs.rdf.first));
      current = current.get(vocabs.rdf.rest);
      if (current.id == vocabs.rdf.nil) break;
    }
    return ret;
  } else return i;
});

function set_current_item(current, val) {
  var builder = Base.Builder();
  builder.set(vocabs.rdf.first, val);
  builder.set(vocabs.rdf.rest, vocabs.rdf.nil);
  val = builder.get();
  var _store = this._base._store;
  var _base = this._base;
  var id;
  if (!current) {
    id = Base.merge_into.call(_base, vocabs.as.items, val);
  } else {
    _store.findByUri(current._subject, vocabs.rdf.rest, null).forEach(_store.removeTriple);
    id = Base.merge_into.call(current, vocabs.rdf.rest, val);
  }
  current = models.wrap_object(_store,_base._reasoner,id,id);
  return current;
}

AsCollection.Builder = function(reasoner, types, base) {
  if (!(this instanceof AsCollection.Builder))
    return new AsCollection.Builder(reasoner, types, base);
  AsObject.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner, vocabs.as.Collection, types), 
    base || new AsCollection(undefined, reasoner));
  utils.defineHidden(this, '_current', null, true);
  utils.defineHidden(this, '_ordered', 0, true);
};
util.inherits(AsCollection.Builder, AsObject.Builder);

['totalItems', 'itemsPerPage'].forEach(function(key) {
  AsCollection.Builder.prototype[key] = function(val) {
    utils.set_non_negative_int.call(this, vocabs.as[key], val);
    return this;
  };
});

['current', 'next', 'prev', 'first', 'last', 'self'].forEach(function(key) {
  AsCollection.Builder.prototype[key] = function(val) {
    this.set(vocabs.as[key], val);
    return this;
  };
});

AsCollection.Builder.prototype.items = function(val) {
  utils.throwif(this._ordered > 0, 'Unordered items cannot be added when the collection already contains ordered items');
  this._ordered = -1;
  if (!Array.isArray(val) && arguments.length > 1)
    val = Array.prototype.slice.call(arguments);
  this.set(vocabs.as.items, val);
  return this;
};
AsCollection.Builder.prototype.orderedItems = function(val) {
  utils.throwif(this._ordered < 0, 'Ordered items cannot be added when the collection already contains unordered items');
  this._ordered = 1;
  if (!val) return this;
  if (!Array.isArray(val)) {
    if (arguments.length > 1) {
      val = Array.prototype.slice.call(arguments);
    } else {
      val = [val];
    }
  }
  for (var n = 0, l = val.length; n < l; n++) {
    this._current = set_current_item.call(this, this._current, val[n]);
  }
  return this;
};

module.exports = AsCollection;


