require('./vocabulary')(
  exports,
  'http://www.w3.org/2001/XMLSchema#', 'xsd',
  [ 'boolean', 'string', 'anyType', 'anySimpleType', 'gMonth',
    'gDay', 'gMonthDay', 'gYear', 'gYearMonth', 'date', 'time',
    'dateTime', 'duration', 'base64Binary', 'hexBinary', 'float',
    'decimal', 'double', 'anyURI', 'QName', 'NOTATION', 'integer',
    'nonPositiveInteger', 'long', 'nonNegativeInteger', 'negativeInteger',
    'int', 'unsignedLong', 'positiveInteger', 'short', 'byte', 
    'unsignedInt', 'unsignedShort', 'unsignedByte', 'normalizedString',
    'token', 'language', 'Name', 'NMTOKEN', 'NCName', 'NMTOKENS',
    'ID', 'IDREF', 'ENTITY', 'IDREFS', 'ENTITIES'
   ]
);


