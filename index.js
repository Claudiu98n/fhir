const { initialize, loggers, constants } = require("@asymmetrik/node-fhir-server-core");
const { VERSIONS } = constants;
const mongoClient = require('./lib/mongo');
const asyncHandler = require('./lib/async-handler');
const globals = require('./globals');
const { mongoConfig } = require('./config');

let fhirServerConfig = {
   profiles: {
      Patient: {
         service: "./services/patient.service.js",
         versions: [VERSIONS["4_0_0"]],
      },
   },
};

let main = async function () {
   let [mongoErr, client] = await asyncHandler(mongoClient(mongoConfig.connection, mongoConfig.options));

   if (mongoErr) {
      console.error(mongoErr.message);
      console.error(mongoConfig.connection);
      process.exit(1);
   }

   globals.set('client', client);
   globals.set('client_db', client.db(mongoConfig.db_name));

   let server = initialize(fhirServerConfig);
   let logger = loggers.get("default");

   server.listen(3000, () => {
      logger.info("Starting the FHIR Server at localhost:3000");
   });
};

main();
