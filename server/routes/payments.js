const {checkout} = require("../controller/payments")
const {paymentVerification} = require("../controller/payments")
const { getkey } = require("../controller/payments")
const { isAuth , loginCheck} = require("../middleware/auth");

const express = require("express");
const router = express.Router();


router.post("/checkout",loginCheck, checkout);
router.post("/paymentverification",loginCheck, paymentVerification);
router.get('/getkey',loginCheck, getkey)



module.exports = router;
