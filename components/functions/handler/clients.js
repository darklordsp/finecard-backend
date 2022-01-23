const {
  osmiauth,
  clientInvite,
  register,
  confirm,
  regencode,
} = require("../function");

module.exports.invite = async (req, res) => {
  const { phonenumber } = req.body;
  await osmiauth();
  console.log(process.env.TOKEN);
  return res.status(200).json({ id: await clientInvite(phonenumber) });
};

module.exports.register = async (req, res) => {
  const { phonenumber } = req.body;
  await osmiauth();
  const coffeehouse_id = req.params.cafeid;
  return res
    .status(200)
    .json({ id: await register(phonenumber, coffeehouse_id) });
};

module.exports.confirm = async (req, res) => {
  const { code, phonenumber } = req.body;
  await osmiauth();
  const cafeid = req.params.cafeid;
  return res.status(200).json({ id: await confirm(cafeid, code, phonenumber) });
};

module.exports.regencode = async (req, res) => {
  const { phonenumber } = req.body;
  await osmiauth();
  const cafeid = req.params.cafeid;
  return res
    .status(200)
    .json({ message: await regencode(phonenumber, cafeid) });
};
