var a = require('./src/activitystreams.js')
  .once('ready', function() {
    a.import(
      {
        '@type': 'Reservation',
        displayName:'Joe'
      }, 
      function(err, doc) {
        console.log(doc.type);
      }
    );
  } 
);
