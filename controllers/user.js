const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtDecode } = require("jwt-decode");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const verifyUser = async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      msg: "Bad request. Please add email and password in the request body",
    });
  }

  let foundUser = await User.findOne({ email: req.body.email });
};

const sendMail = async (mailoptions, cb) => {
  transporter.sendMail(mailoptions, async (error, info) => {
    if (error) {
      cb(error);
    }
    cb(true);
  });
};

const requestOtp = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      msg: "Bad request. Please add email and password in the request body",
    });
  }
  let foundUser = await User.findOne({ email: req.body.email });
  const generateOTP = () => {
    const length = 6;
    const characters = "0123456789";
    let otp = "";
    for (let o = 0; o < length; o++) {
      const getRandomIndex = Math.floor(Math.random() * characters.length);
      otp += characters[getRandomIndex];
    }
    return otp;
  };
  const otp = generateOTP();
  const mailoptions = {
    from: "Auth-backend-service",
    to: email,
    subject: "Email verification OTP",
    html: `<p>Dear ${foundUser.name}. Your email verification otp is ${otp}</p>`,
  };
  await sendMail(mailoptions, (done) => {
    if (done === true) {
      return res.status(201).json({
        msg: "Check your email for verification otp ",
      });
    }
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      msg: "Bad request. Please add email and password in the request body",
    });
  }

  let foundUser = await User.findOne({ email: req.body.email });
  if (foundUser) {
    const isMatch = await foundUser.comparePassword(password);

    if (isMatch) {
      const token = jwt.sign(
        { id: foundUser._id, name: foundUser.name },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );

      return res.status(200).json({
        msg: "user logged in",
        token,
        user: {
          id: foundUser._id,
          email: foundUser.email,
          isVerified: foundUser.isVerified,
          name: foundUser.name,
          v: foundUser._v,
        },
      });
    } else {
      return res.status(400).json({ msg: "Bad password" });
    }
  } else {
    return res.status(400).json({ msg: "Bad credentails" });
  }
};

const generatePassword = () => {
  var length = 8,
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

const googleLogin = async (req, res) => {
  const googleInfo = jwtDecode(req.body.credential);
  let foundUser = await User.findOne({ email: googleInfo.email });
  if (foundUser === null) {
    let { email } = googleInfo;
    const password = generatePassword();
    if (email.length && password.length) {
      const person = new User({
        name: email,
        email: email,
        password: password,
        isVerified: true,
      });
      await person.save();
      const newUser = await User.findOne({ email: googleInfo.email });
      const token = jwt.sign(
        { id: newUser._id, name: newUser.name },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );
      return res
        .status(200)
        .json({ msg: "user logged in", token, user: googleInfo });
    } else {
      return res
        .status(400)
        .json({ msg: "Please add all values in the request body" });
    }
  } else {
    const token = jwt.sign(
      { id: foundUser._id, name: foundUser.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );
    return res.status(200).json({
      msg: "user logged in",
      token,
      user: {
        ...googleInfo,
        ...googleInfo,
        id: foundUser._id,
        email: foundUser.email,
        isVerified: foundUser.isVerified,
        name: foundUser.name,
        v: foundUser._v,
      },
    });
  }
};

const logout = async (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
};

const dashboard = async (req, res) => {
  const luckyNumber = Math.floor(Math.random() * 100);

  res.status(200).json({
    msg: `Hello, ${req.user.name}`,
    secret: `Here is your authorized data, your lucky number is ${luckyNumber}`,
  });
};

const getAllUsers = async (req, res) => {
  let users = await User.find({});

  return res.status(200).json({ users });
};

const register = async (req, res) => {
  let foundUser = await User.findOne({ email: req.body.email });
  if (foundUser === null) {
    let { username, email, password } = req.body;
    if (username.length && email.length && password.length) {
      const person = new User({
        name: username,
        email: email,
        password: password,
        isVerified: false,
      });
      await person.save();
      return res.status(201).json({ person });
    } else {
      return res
        .status(400)
        .json({ msg: "Please add all values in the request body" });
    }
  } else {
    return res.status(400).json({ msg: "Email already in use" });
  }
};

module.exports = {
  login,
  logout,
  register,
  dashboard,
  googleLogin,
  getAllUsers,
  verifyUser,
  requestOtp,
};
