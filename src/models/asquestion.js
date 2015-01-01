var AsActivity = require('./asactivity'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs');

function AsQuestion(store, reasoner, id, subject) {
  if (!(this instanceof AsQuestion))
    return new AsQuestion(store, reasoner, id, subject);
  AsActivity.call(this, store, reasoner, id, subject);
}
util.inherits(AsQuestion, AsActivity);
['height','width','duration','anyOf','oneOf'].forEach(function(key) {
  utils.defineProperty(AsQuestion.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});

AsQuestion.Builder = function(reasoner,types,base) {
  if (!(this instanceof AsQuestion.Builder))
    return new AsQuestion.Builder(reasoner, types, base);
  AsActivity.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner,vocabs.as.Question, types),
    base || new AsQuestion(undefined,reasoner));
};
util.inherits(AsQuestion.Builder, AsActivity.Builder);

['height','width'].forEach(function(key) {
  AsQuestion.Builder.prototype[key] = function(val) {
    utils.set_non_negative_int.call(this, vocabs.as[key], val);
    return this;
  };
});
['duration'].forEach(function(key) {
  AsQuestion.Builder.prototype[key] = function(val) {
    utils.set_duration_val.call(this, vocabs.as[key], val);
    return this;
  };
});
['oneOf', 'anyOf'].forEach(function(key) {
  AsQuestion.Builder.prototype[key] = function(val) {
    this.set(vocabs.as[key], val);
    return this;
  };
});

exports.AsQuestion = AsQuestion;

