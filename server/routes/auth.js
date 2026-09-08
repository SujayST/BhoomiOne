const express = require("express");
const passport = require("passport");
const router = express.Router();

const authController = require("../controller/auth");
const { loginCheck, isAuth, isAdmin } = require("../middleware/auth");
const {verifySuperAdmin, verifyStoreAdmin} =require("../middleware/auth")

router.get("/login/success", (req, res, next) => {
	if (req.user) {
		res.status(200).json({
			error: false,
			message: "Successfully Loged In",
			user: req.user,
		});
		console.log("login successful- 1")
        next()
	} else {
		res.status(403).json({ error: true, message: "Not Authorized" });
		console.log("Not Authorized")
	}
});

router.get("/login/failed", (req, res) => {
	res.status(401).json({
		error: true,
		message: "Log in failure",
	});
});

router.get(
    "/google", 
    passport.authenticate("google", ["profile", "email"]));

router.get(
	"/google/callback",
	passport.authenticate("google", {
		successRedirect: process.env.CLIENT_URL,
		failureRedirect: "/api/login/failed",
	})
);

router.get("/logout", (req, res) => {
	req.logout();
	res.redirect(process.env.CLIENT_URL);
});

router.post("/isadmin", authController.isAdmin);
router.post("/signup", authController.postSignup);
router.post("/signup_app", authController.postSignupApp);
router.post("/signin", authController.postSignin);
router.post("/user", loginCheck, isAuth, isAdmin, authController.allUser);
router.post("/get-store-admin", loginCheck, verifyStoreAdmin,authController.getStoreAdmin);
router.post("/get-super-admin", loginCheck, verifySuperAdmin, authController.getSuperAdmin);
module.exports = router;
