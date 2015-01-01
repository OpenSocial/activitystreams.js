
var vocabs = require('../vocabs');

exports.Base = require('./base');
exports.Object = require('./asobject');
exports.Activity = require('./asactivity');
exports.Actor = require('./asactor');
exports.Collection = require('./ascollection');
exports.OrderedCollection = require('./asorderedcollection');
exports.Content = require('./ascontent');
exports.Link = require('./aslink');
exports.Place = require('./asplace');
exports.PossibleAnswer = require('./aspossibleanswer');
exports.Question = require('./asquestion');

exports.wrap_object = function (store, reasoner, subject, id) {
  if (subject === undefined) throw new Error();
  var types = store.findByUri(subject, vocabs.rdf.type, null);
  var thing = exports.Object;
  for (var n = 0, l = types.length; n < l; n++) {
    var type = types[n].object;
    if (reasoner.isSubClassOf(type,vocabs.as.Link)) {
      thing = exports.Link;
    } else if (reasoner.isSubClassOf(type,vocabs.as.OrderedCollection)) {
      thing = exports.OrderedCollection;
    } else if (reasoner.isSubClassOf(type,vocabs.as.Collection)) {
      thing = exports.Collection;
    } else if (reasoner.isSubClassOf(type,vocabs.as.Actor)) {
      thing = exports.Actor;
    } else if (reasoner.isSubClassOf(type,vocabs.as.Question)) {
      thing = exports.Question;
    } else if (reasoner.isSubClassOf(type,vocabs.as.Activity)) {
      thing = exports.Activity;
    } else if (reasoner.isSubClassOf(type,vocabs.as.PossibleAnswer)) {
      thing = exports.PossibleAnswer;
    } else if (reasoner.isSubClassOf(type,vocabs.as.Content)) {
      thing = exports.Content;
    } else if (reasoner.isSubClassOf(type,vocabs.as.Place)) {
      thing = exports.Place;
    }
  }
  return thing(store, reasoner, id, subject);
};
