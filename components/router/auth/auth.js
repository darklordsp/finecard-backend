const handler = require("../../functions/handler/auth");
const jwt = require("jsonwebtoken");
module.exports = (app) => {
  app
    .post("/auth/signin", handler.signin)
    .post("/auth/signup", handler.signup)
    .post("/auth/restore", handler.restore);
};
