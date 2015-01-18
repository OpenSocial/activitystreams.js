
module.exports = function (exports, ns, prefix, terms) {
  var define = function(root, name, value) {
    Object.defineProperty(root, name, {
      value: value, 
      enumerable: true,
      configurable: false
    });
  };
  define(exports, 'ns', ns);
  define(exports, 'prefix', prefix);
  if (Array.isArray(terms))
    terms.forEach(function(term) {
      define(exports, term, ns + term);
    });
};
