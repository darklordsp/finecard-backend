const { clients } = require("../../entities");
const { osmiauth, osmiCardGenerate, osmiCheckCode } = require("../function");
const axios = require("axios");
const jwt = require("jsonwebtoken");

module.exports.generate = async (req, res) => {
  const { phonenumber } = req.body;
  await osmiauth();
  return res
    .status(200)
    .json({ id: await osmiCardGenerate(phonenumber, undefined) });
};

module.exports.check = async (req, res) => {
  const { qr_url } = req.body;
  await osmiauth();
  console.log(process.env.TOKEN);
  return res.status(200).json({ message: await osmiCheckCode(qr_url) });
};
