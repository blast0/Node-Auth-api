const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtDecode } = require("jwt-decode");

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

      return res.status(200).json({ msg: "user logged in", token });
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
    return res
      .status(200)
      .json({ msg: "user logged in", token, user: googleInfo });
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
};
