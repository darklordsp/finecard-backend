module.exports = (app, passport) => {
  require("./auth/auth")(app);
  require("./cards/cards")(app, passport);
  require("./clients/clients")(app, passport);
};
