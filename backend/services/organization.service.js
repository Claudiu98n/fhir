const globals = require("../globals");

const { resolveSchema } = require("@asymmetrik/node-fhir-server-core");
const logger = require("@asymmetrik/node-fhir-server-core").loggers.get();
const moment = require("moment");
const { ObjectId } = require("mongodb");

let getOrganization = (base_version) => {
  return resolveSchema(base_version, "Organization");
};

let getMeta = (base_version) => {
  return resolveSchema(base_version, "Meta");
};

// create organization
module.exports.create = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info("Creating a new organization");

    let resource = req.body;
    let { base_version } = args;

    let db = globals.get("client_db");
    let collection = db.collection(`organizations_collection_${base_version}`);

    let id = new ObjectId().toString();

    let Organization = getOrganization(base_version);
    let organization = new Organization(resource);
    let Meta = getMeta(base_version);
    organization.meta = new Meta({
      versionId: "1",
      lastUpdated: moment.utc().format("YYYY-MM-DDTHH:mm:ssZ"),
    });

    let doc = JSON.parse(JSON.stringify(organization.toJSON()));
    Object.assign(doc, { id: id });

    collection.insertOne(doc, (err) => {
      if (err) {
        logger.error("Error while creating new Organization: ", err);
        return reject(err);
      }
    });

    return resolve(organization);
  });

// get organizations
module.exports.search = (args) =>
  new Promise((resolve, reject) => {
    logger.info("Getting all organizations");

    let { base_version } = args;

    let db = globals.get("client_db");
    let collection = db.collection(`organizations_collection_${base_version}`);

    let Organization = getOrganization(base_version);

    collection.find({}).toArray((err, docs) => {
      if (err) {
        logger.error("Error while getting all organizations: ", err);
        return reject(err);
      }
      let organizations = [];
      docs.forEach((doc) => {
        let organization = new Organization(doc);
        organizations.push(organization);
      });
      return resolve(organizations);
    });
  });

// update organization
module.exports.update = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info(`Updating organization with id ${args.id}`);

    let { base_version } = args;
    let { id } = args;

    let resource = req.body;

    let db = globals.get("client_db");
    let collection = db.collection(`organizations_collection_${base_version}`);

    collection.findOne({ id: id }, (err, data) => {
      if (err) {
        logger.error("Error while searching organization", err);
        return reject(err);
      }

      if (!data) {
        return reject(new Error(`Organization with id ${id} not found`));
      }

      let Organization = getOrganization(base_version);
      let organization = new Organization(resource);

      let foundOrganization = new Organization(data);
      let meta = foundOrganization.meta;
      meta.versionId = (parseInt(foundOrganization.meta.versionId) + 1).toString();
      meta.lastUpdated = moment.utc().format("YYYY-MM-DDTHH:mm:ssZ");
      organization.meta = meta;

      let doc = JSON.parse(JSON.stringify(organization.toJSON()));
      Object.assign(doc, { id: id });

      collection.updateOne({ id: id }, { $set: doc }, (err) => {
        if (err) {
          logger.error("Error while updating organization: ", err);
          return reject(err);
        }
      });
      return resolve(organization);
    });
  });

// delete organization
module.exports.remove = (args) =>
  new Promise((resolve, reject) => {
    logger.info(`Delete organization with id ${args.id}`);

    let { base_version } = args;
    let { id } = args;

    let db = globals.get("client_db");
    let collection = db.collection(`organizations_collection_${base_version}`);

    collection.findOne({ id: id }, (err, data) => {
      if (err) {
        logger.error("Error while searching organization", err);
        return reject(err);
      }

      if (!data) {
        return reject(new Error(`Organization with id ${id} not found`));
      }

      collection.deleteOne({ id: id }, (err) => {
        if (err) {
          logger.error("Error while deleting organization: ", err);
          return reject(err);
        }
      });
      return resolve();
    });
  });
