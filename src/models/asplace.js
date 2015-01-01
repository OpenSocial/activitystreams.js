var AsObject = require('./asobject'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs');

function AsPlace(store, reasoner, id, subject) {
  if (!(this instanceof AsPlace))
    return new AsPlace(store, reasoner, id, subject);
  AsObject.call(this, store, reasoner, id, subject);
}
util.inherits(AsPlace, AsObject);
['accuracy', 'altitude', 'latitude', 'longitude',
 'radius', 'units'].forEach(function(key) {
  utils.defineProperty(AsPlace.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});

AsPlace.Builder = function(reasoner,types,base) {
  if (!(this instanceof AsPlace.Builder))
    return new AsPlace.Builder(reasoner,types,base);
  AsObject.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner,vocabs.as.Place, types),
    base || new AsPlace(undefined,reasoner));
};
util.inherits(AsPlace.Builder,AsObject.Builder);

AsPlace.Builder.prototype.accuracy = function(val) {
  utils.set_ranged_val.call(this, vocabs.as.accuracy, val, 0.00, 100.0, vocabs.xsd.float);
  return this;
};
AsPlace.Builder.prototype.altitude = function(val) {
  utils.throwif(!utils.is_number(val), 'altitude must be a number');
  this.set(vocabs.as.altitude, val, {type: vocabs.xsd.float});
  return this;
};
AsPlace.Builder.prototype.latitude = function(val) {
  utils.throwif(!utils.is_number(val), 'latitude must be a number');
  utils.set_ranged_val.call(this, vocabs.as.latitude, val, -90.0, 90.0, vocabs.xsd.float);
  return this;
};
AsPlace.Builder.prototype.longitude = function(val) {
  utils.throwif(!utils.is_number(val), 'longitude must be a number');
  utils.set_ranged_val.call(this, vocabs.as.longitude, val, -180.0, 180.0, vocabs.xsd.float);
  return this;
};
AsPlace.Builder.prototype.radius = function(val) {
  utils.throwif(!utils.is_number(val), 'radius must be a number');
  utils.set_ranged_val.call(this, vocabs.as.radius, val, 0.00, Infinity, vocabs.xsd.float);
  return this;
};
AsPlace.Builder.prototype.units = function(val) {
  this.set(vocabs.as.units, val);
  return this;
};

module.exports = AsPlace;