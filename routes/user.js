const express = require("express");
const router = express.Router();

const {
  login,
  logout,
  register,
  dashboard,
  googleLogin,
  getAllUsers,
  verifyUser,
  requestOtp,
} = require("../controllers/user");
const authMiddleware = require("../middleware/auth");

router.route("/login").post(login);
router.route("/verify").post(verifyUser);
router.route("/getOtp").post(requestOtp);
router.route("/googlelogin").post(googleLogin);
router.route("/logout").post(logout);
router.route("/register").post(register);
router.route("/dashboard").get(authMiddleware, dashboard);
router.route("/users").get(getAllUsers);

module.exports = router;
