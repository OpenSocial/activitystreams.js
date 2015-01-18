var utils = require('../utils'),
    LanguageTag = require('rfc5646');

function LanguageValue() {
  if (!(this instanceof LanguageValue))
    return new LanguageValue();
  utils.defineHidden(this,'_def',undefined,true);
  if (LanguageValue.system_language) {
    utils.defineHidden(this, LanguageValue.system_language, function() {
      return this['*'];
    });
  }
}

LanguageValue.system_language =
  process.env.LANG ?
    process.env.LANG.split('.')[0].replace('_','-') : 'en';

LanguageValue.prototype = {
  get '*'() {
    if (LanguageValue.system_language) {
      var keys = Object.keys(this);
      for (var n = 0, l = keys.length; n < l; n++) {
        var tag = new LanguageTag(keys[n]);
        if (tag.suitableFor(LanguageValue.system_language))
          return this[keys[n]];
      }
    }
    return this._def;
  },
  toString : function() {
    return this['*'];
  }
};

module.exports = LanguageValue;