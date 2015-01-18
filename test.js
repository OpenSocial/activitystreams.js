var a = require('./src/activitystreams.js')

a.import(
  {
    '@type': 'Reservation',
    displayNameMap: 'J"o"e'
  }, 
  function(err, doc) {
    
    doc.export(
      function(e,d) {
        console.log(JSON.stringify(d));
      }
    );

  }
);


