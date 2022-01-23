const handler = require("../../functions/handler/clients");
module.exports = (app, passport) => {
  app
    .post(
      "/client/invite",
      passport.authenticate("jwt", { session: false }),
      handler.invite
    )
    .post("/:cafeid/client/register", handler.register)
    .post("/:cafeid/client/confirm", handler.confirm)
    .post("/:cafeid/client/regencode", handler.regencode);
};
