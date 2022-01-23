const { osmiauth } = require("../../functions/function");
const handler = require("../../functions/handler/cards");
module.exports = (app, passport) => {
  app
    .post(
      "/cards/generate",
      passport.authenticate("jwt", { session: false }),
      handler.generate
    )
    .post(
      "/cards/check",
      passport.authenticate("jwt", { session: false }),
      handler.check
    )
    .get("/", async (req, res) => {
      await osmiauth();
      console.log(process.env.TOKEN);
      res.end();
    });
};
