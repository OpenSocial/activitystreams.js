var AsContent = require('./ascontent'),
    util = require('util'),
    utils = require('../utils'),
    vocabs = require('../vocabs');

function AsPossibleAnswer(store, reasoner, id, subject) {
  if (!(this instanceof AsPossibleAnswer))
    return new AsPossibleAnswer(store, reasoner, id, subject);
  AsContent.call(this, store, reasoner, id, subject);
}
util.inherits(AsPossibleAnswer, AsContent);
['shape'].forEach(function(key) {
  utils.defineProperty(AsPossibleAnswer.prototype, key, function() {
    return this.get(vocabs.as[key]);
  });
});

AsPossibleAnswer.Builder = function(reasoner, types, base) {
  if (!(this instanceof AsPossibleAnswer.Builder))
    return new AsPossibleAnswer.Builder(reasoner,types,base);
  AsContent.Builder.call(
    this, 
    reasoner, 
    utils.merge_types(reasoner,vocabs.as.PossibleAnswer,types),
    base || new AsPossibleAnswer(undefined,reasoner));
};
util.inherits(AsPossibleAnswer.Builder, AsContent.Builder);
AsPossibleAnswer.Builder.prototype.shape = function(val) {
  this.set(vocabs.as.shape, val);
  return this;
};

module.exports = AsPossibleAnswer;
