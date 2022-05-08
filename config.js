require("dotenv").config();

let mongoConfig = {
  connection: `mongodb://${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}`,
  db_name: process.env.MONGO_DB_NAME,
  options: {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  },
};

module.exports = {
  mongoConfig,
};
