var vocabs = require('./vocabs'),
    utils = require('./utils'),
    util = require('util'),
    events = require('events'),
    N3 = require('n3'),
    fs = require('fs'),
    path = require('path');

(function(exports) {

  var __datafile = path.resolve(module.filename,'../data/activitystreams2.owl');

  function subClassHierarchy(store, subject) {
    var types = [subject];
    var res = store.findByUri(subject, vocabs.rdfs.subClassOf, null);
    for (var n = 0, l = res.length; n < l; n++)
      types.push(subClassHierarchy(store, res[n].object));
    return types;
  }

  function subPropertyHierarchy(store, subject) {
    var types = [subject];
    var res = store.findByUri(subject, vocabs.rdfs.subPropertyOf, null);
    for (var n = 0, l = res.length; n < l; n++)
      types.push(subPropertyHierarchy(store, res[n].object));
    return types;
  }

  function descendantPropertiesOf(store, subject) {
    var types = [subject];
    var res = store.findByUri(null, vocabs.rdfs.subPropertyOf, subject);
    for (var n = 0, l = res.length; n < l; n++)
      types.push(descendantPropertiesOf(store, res[n].subject));
    return types;
  }

  function descendantClassesOf(store, subject) {
    var types = [subject];
    var res = store.findByUri(null, vocabs.rdfs.subClassOf, subject);
    for (var n = 0, l = res.length; n < l; n++)
      types.push(descendantClassesOf(store, res[n].subject));
    return types;
  }

  function searchTypes(types, object) {
    for (var n = 0, l = types.length; n < l; n++) {
      if (Array.isArray(types[n])) {
        if (searchTypes(types[n],object))
          return true;
      } else {
        if (object == types[n])
          return true;
      }
    }
    return false;
  }

  function isSubClassOf(store, subject, object) {
    if (subject == object) return true;
    var types = subClassHierarchy(store, subject);
    return searchTypes(types, object);
  }

  function isSubPropertyOf(store, subject, object) {
    if (subject == object) return true;
    var types = subPropertyHierarchy(store, subject);
    return searchTypes(types, object);
  }

  function count_type(subject, type) {
    return this._store.countByUri(subject, vocabs.rdf.type, type) > 0;
  }

  function Reasoner(callback, errorCallback) {
    if (!(this instanceof Reasoner))
      return new Reasoner();
    utils.defineHidden(this, '_store', new N3.Store());
    events.EventEmitter.call(this);
    if (typeof callback === 'function')
      this.once('ready', callback);
    if (typeof errorCallback === 'function')
      this.once('error', errorCallback);
    var self = this;
    var stream = fs.createReadStream(__datafile);
    this.use_stream(stream, function(err) {
      if (err) {
        self.emit('error', err);
      } else {
        self.emit('ready', self);
      }
    });
  }
  util.inherits(Reasoner, events.EventEmitter);
  Reasoner.prototype.use_stream = 
    function(stream, callback) {
      var self = this;
      var parser = N3.Parser();
      parser.parse(stream, function(err, triple) {
        if (err) {
          callback(err);
          return;
        }
        if (triple) {
          self.add(triple);
        } else {
          self.emit('triples-added');
          callback();
        }
      });
    };

  Reasoner.prototype.add =
    function(subject, predicate, object) {
      this._store.addTriple(subject, predicate, object);
      this.emit('triple-added');
      return this;
    };

  Reasoner.prototype.addMany = 
    function(triples) {
      this._store.addTriples(triples);
      this.emit('triples-added');
      return this;
    };

  Reasoner.prototype.declare =
    function(prefix, uri) {
      this._store.addPrefix(prefix, uri);
      this.emit('prefix-declared');
      return this;
    };

  Reasoner.prototype.declareMany =
    function(prefixes) {
      this._store.addPrefixes(prefixes);
      this.emit('prefixes-declared');
      return this;
    };

  Reasoner.prototype.classHierarchy = 
    function(subject) {
      return subClassHierarchy(this._store, subject);
    };

  Reasoner.prototype.propertyHierarchy = 
    function(subject) {
      return subPropertyHierarchy(this._store, subject);
    };

  Reasoner.prototype.isSubClassOf = 
    function(subject, object) {
      if (Array.isArray(subject)) {
        for (var n = 0, l = subject.length; n < l; n++) {
          if (isSubClassOf(this._store, subject[n], object))
            return true;
        }
        return false;
      } else {
        return isSubClassOf(this._store, subject, object);
      }
    };

  Reasoner.prototype.isSubPropertyOf = 
    function(subject, object) {
      if (Array.isArray(subject)) {
        for (var n = 0, l = subject.length; n < l; n++) {
          if (isSubPropertyOf(this._store, subject[n], object))
            return true;
        }
        return false;
      } else {
        return isSubPropertyOf(this._store, subject, object);
      }
    };

  Reasoner.prototype.descendantClassesOf = 
    function(subject) {
      return descendantClassesOf(this._store, subject);
    };

  Reasoner.prototype.descendantPropertiesOf = 
    function(subject) {
      return descendantPropertiesOf(this._store, subject);
    };

  Reasoner.prototype.is_an_object = 
    function(subject) {
      return !this.isSubClassOf(subject, as.Link);
    };

  Reasoner.prototype.is_a_link = 
    function(subject) {
      return this.isSubClassOf(subject, as.Link);
    };

  Reasoner.prototype.is_known = 
    function(subject) {
      if (Array.isArray(subject)) {
        for (var n = 0, l = subject.length; n < l; n++) {
          if (this.is_known(subject[n]))
            return true;
        }
        return false;
      } else {
        return  this._store.countByUri(subject) > 0;
      }
    };

  Reasoner.prototype.is_object_property = 
    function(subject) {
      return count_type.call(this, subject, vocabs.owl.ObjectProperty) > 0;
    };

  Reasoner.prototype.is_functional = 
    function(subject) {
      return count_type.call(this, subject, vocabs.owl.FunctionalProperty) > 0;
    };

  Reasoner.prototype.is_deprecated = 
    function(subject) {
      return count_type.call(this, subject, vocabs.owl.DeprecatedProperty) > 0;
    };

  Reasoner.prototype.is_language_property = 
    function(subject) {
      return count_type.call(this, subject, vocabs.asx.LanguageProperty) > 0;
    };

  Reasoner.prototype.is_intransitive = 
    function(subject) {
      return this.isSubClassOf(subject, vocabs.as.IntransitiveActivity);
    };

  Reasoner.prototype.is_number = 
    function(subject) {
      return this.isSubClassOf(subject, vocabs.asx.Number);
    };

  Reasoner.prototype.is_date = 
    function(subject) {
      return this.isSubClassOf(subject, vocabs.asx.Date);
    };

  Reasoner.prototype.is_boolean = 
    function(subject) {
      return this.isSubClassOf(subject, vocabs.asx.Boolean);
    };

  exports.Reasoner = Reasoner;
})(exports);