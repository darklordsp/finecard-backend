const { users } = require("../../entities");
const jwt = require("jsonwebtoken");
const generator = require("generate-password");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: `${process.env.EMAIL_HOST}`,
  port: `${process.env.EMAIL_PORT}`,
  secure: true,
  auth: {
    user: `${process.env.EMAIL}`,
    pass: `${process.env.EMAIL_PASSWORD}`,
  },
});

require("../passport");

genToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      coffeehouse: user.coffeehouse,
      maxstamps: user.maxstamps,
      phonenumber: user.phonenumber,
      email: user.email,
    },
    process.env.SECRET_KEY
  );
};

module.exports.signup = async (req, res, next) => {
  let { coffeehouse, phonenumber, maxstamps, email, password } = req.body;
  let token;
  try {
    let foundUser = await users.findOne({ email });
    if (foundUser) {
      return res.status(403).json({ message: "Email is already in use" });
    }

    password = !password
      ? generator.generate({
          length: 10,
          numbers: true,
        })
      : password;

    const newUser = new users({
      coffeehouse,
      phonenumber,
      maxstamps,
      email,
      password: bcrypt.hashSync(password, 10),
    });
    await newUser.save();

    let mailOptions = {
      from: `${process.env.EMAIL}`,
      to: email,
      subject: "Регистрация",
      text: "Ваш логин:" + email + " " + "Ваш пароль:" + password,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.log(err);
      return err;
    }

    token = genToken(newUser);
    process.env.LOCAL_TOKEN = token;
    return res.status(200).json({ id: newUser._id, token });
  } catch (err) {
    return res.json({ message: err.message });
  }
};

module.exports.signin = async (req, res) => {
  let { email, password } = req.body;

  let userExist = await users.findOne({ email });

  if (!userExist) {
    return res.status(200).json({ message: "User not found" });
  } else {
    let checkPassword = bcrypt.compareSync(password, userExist.password);

    if (checkPassword) {
      token = genToken(userExist);
      process.env.LOCAL_TOKEN = token;
      return res.status(200).json({ token });
    } else {
      res.status(200).json({ message: "Password is incorrect" });
    }
  }
};

module.exports.restore = async (req, res, next) => {
  let { email } = req.body;

  let emailExist = await users.findOne({ email });

  if (emailExist) {
    let generatedPassword = generator.generate({
      length: 10,
      numbers: true,
    });

    let mailOptions = {
      from: `${process.env.EMAIL}`,
      to: email,
      subject: "Сброс пароля",
      text:
        "Ваш логин:" + email + " " + "Ваш новый пароль:" + generatedPassword,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.log(err);
      return err;
    }

    let password = bcrypt.hashSync(generatedPassword, 10);
    try {
      await users.updateOne({ email }, { password });
    } catch (err) {
      console.log(err);
      return err;
    }
    return res.status(200).json({ message: "Password updated" });
  } else {
    return res.status(200).json({ message: "Email not found" });
  }
};
