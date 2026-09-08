const express = require("express");
const router = express.Router();
const forgotPasswordController = require("../controller/forgotPassword")

router.post("/send-reset-link",forgotPasswordController.sendEmail);
router.post("/check-validity",forgotPasswordController.checkIfTokenIsStillValid);
router.post("/change-password",forgotPasswordController.changePassword)

module.exports = router