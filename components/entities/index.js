const mongoose = require("mongoose");

module.exports = {
  users: require("./users/users.entity")(mongoose),
  codes: require("./codes/codes.entity")(mongoose),
  scans: require("./scans/scans.entity")(mongoose),
  clients: require("./client/clients.entity")(mongoose),
};
