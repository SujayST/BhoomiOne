const express = require("express");
const router = express.Router();
const couponsController = require("../controller/coupons");
const {loginCheck,isAdmin} = require("../middleware/auth")

//Recheck these login
router.post("/add-coupon",loginCheck,isAdmin,couponsController.addCoupon);
router.get("/get-allcoupon",couponsController.getAllCoupons);
//change this loginCheck to suitable adminCheck
router.post("/get-coupon-by-store",loginCheck,couponsController.getCouponsByStoreId);
router.post("/delete-coupon",loginCheck,isAdmin,couponsController.deleteCouponById)

module.exports = router;