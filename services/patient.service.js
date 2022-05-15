const globals = require("../globals");

const { resolveSchema } = require("@asymmetrik/node-fhir-server-core");
const logger = require("@asymmetrik/node-fhir-server-core").loggers.get();
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");

let getPatient = (base_version) => {
  return resolveSchema(base_version, "Patient");
};

let getMeta = (base_version) => {
  return resolveSchema(base_version, "Meta");
};

// create patient
module.exports.create = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info("Creating a new patient");

    let resource = req.body;
    let { base_version } = args;

    let db = globals.get("client_db");
    let collection = db.collection(`patients_collection_${base_version}`);

    let Patient = getPatient(base_version);
    let patient = new Patient(resource);

    let id = uuidv4();

    let Meta = getMeta(base_version);
    patient.meta = new Meta({
      versionId: "1",
      lastUpdated: moment.utc().format("YYYY-MM-DDTHH:mm:ssZ"),
    });

    let doc = JSON.parse(JSON.stringify(patient.toJSON()));
    Object.assign(doc, { id: id });

    collection.insertOne(doc, (err) => {
      if (err) {
        logger.error("Error while creating new Patient: ", err);
        return reject(err);
      }
    });

    return resolve(patient);
  });

// get patients
module.exports.search = (args) =>
  new Promise((resolve, reject) => {
    logger.info("Getting all patients");

    let { base_version } = args;

    let db = globals.get("client_db");
    let collection = db.collection(`patients_collection_${base_version}`);

    let Patient = getPatient(base_version);

    collection.find({}).toArray((err, docs) => {
      if (err) {
        logger.error("Error while getting all patients: ", err);
        return reject(err);
      }
      let patients = [];
      docs.forEach((doc) => {
        let patient = new Patient(doc);
        patients.push(patient);
      });
      return resolve(patients);
    });
  });

// update patient
module.exports.update = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info(`Updating patient with id ${args.id}`);

    let { base_version } = args;
    let { id } = args;

    let resource = req.body;

    let db = globals.get("client_db");
    let collection = db.collection(`patients_collection_${base_version}`);

    collection.findOne({ id: id }, (err, data) => {
      if (err) {
        logger.error("Error while searching patient", err);
        return reject(err);
      }

      if (!data) {
        return reject(new Error(`Patient with id ${id} not found`));
      }

      let Patient = getPatient(base_version);
      let patient = new Patient(resource);

      let foundPatient = new Patient(data);
      let meta = foundPatient.meta;
      meta.versionId = (parseInt(foundPatient.meta.versionId) + 1).toString();
      meta.lastUpdated = moment.utc().format("YYYY-MM-DDTHH:mm:ssZ");
      patient.meta = meta;

      let doc = JSON.parse(JSON.stringify(patient.toJSON()));
      Object.assign(doc, { id: id });

      collection.updateOne({ id: id }, { $set: doc }, (err) => {
        if (err) {
          logger.error("Error while updating patient: ", err);
          return reject(err);
        }
      });
      return resolve(patient);
    });
  });

// delete patient
module.exports.remove = (args) =>
  new Promise((resolve, reject) => {
    logger.info(`Delete patient with id ${args.id}`);

    let { base_version } = args;
    let { id } = args;

    let db = globals.get("client_db");
    let collection = db.collection(`patients_collection_${base_version}`);

    collection.findOne({ id: id }, (err, data) => {
      if (err) {
        logger.error("Error while searching patient", err);
        return reject(err);
      }

      if (!data) {
        return reject(new Error(`Patient with id ${id} not found`));
      }

      collection.deleteOne({ id: id }, (err) => {
        if (err) {
          logger.error("Error while deleting patient: ", err);
          return reject(err);
        }
      });
      return resolve();
    });
  });
