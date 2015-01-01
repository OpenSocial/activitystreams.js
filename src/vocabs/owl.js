require('./vocabulary')(
  exports,
  'http://www.w3.org/2002/07/owl#', 'owl',
  ['Class', 'DatatypeProperty', 'ObjectProperty', 
   'FunctionalProperty', 'DeprecatedPropety']
);
