const { MongoClient } = require('mongodb');

let connect = (url, options) =>
  new Promise((resolve, reject) => {
    // Connect to mongo
    MongoClient.connect(url, options, (err, client) => {
      if (err) {
        return reject(err);
      }
      return resolve(client);
    });
  });

module.exports = connect;