const couponModel = require("../models/coupon.js")
const mongoose = require('mongoose');
const checkValidCoupons = require('./utils/checkValidCoupons.js')

class Coupons {

    async addCoupon(req, res) {
        let { couponName,
            couponDescription,
            applicableStore,
            applicableMinimumAmount,
            applicableDiscountValue,
            applicableDiscountType,
            couponMaximumRedemptions,
            couponMaximumRedemptionByIndividualUser } = req.body;

        if (
            !couponName ||
            !couponDescription ||
            !applicableStore ||
            applicableDiscountValue === 0 ||
            applicableDiscountType === ''
        ) {
            return res.json({ error: "All fields must be filled" });
        }
        else {

            try {
                let newCoupon = new couponModel({
                    couponName,
                    couponDescription,
                    applicableStore,
                    applicableMinimumAmount,
                    applicableDiscountValue,
                    applicableDiscountType,
                    couponMaximumRedemptions,
                    couponMaximumRedemptionByIndividualUser
                });
                let save = await newCoupon.save();
                if (save) {
                    return res.json({ success: "Coupon created successfully" });
                }

            }
            catch (err) {
                res.json({ error: err });
            }
        }
    }

    async getAllCoupons(req, res) {
        try {
            let Coupons = await couponModel.find({})
            if (Coupons)
                return res.json(Coupons)
            return res.json({ error: "Error finding coupons" })
        }
        catch (err) {
            return res.json({ error: err })
        }
    }

    async getCouponsByStoreId(req, res) {
        let { storeId } = req.body;
        let userId = req.userDetails._id;
        //change this after removing role from localstorage
        let role = req.userDetails.role

        try {
            let storeCoupons = await couponModel.find({ "applicableStore": storeId })

            if (storeCoupons) {
                if (role === 0) {
                    storeCoupons = await checkValidCoupons.checkIfUserHasUtilisedMaximumNumberOfTimes(storeCoupons, userId)
                }
                return res.json(storeCoupons)
            }

            return res.json({ error: "Error finding coupons" })
        }
        catch (err) {
            return res.json({ error: err });
        }
    }



    async deleteCouponById(req, res) {
        const { couponId } = req.body;
        try {
            const deleteSuccess = await couponModel.deleteOne({ "_id": couponId });
            if (deleteSuccess.deletedCount == 1)
                return res.json({ success: "Deleted successfully" })
            return res.json({ error: "Error deleting" })
        }

        catch (err) {
            return res.json({ error: err })
        }
    }
}

const ordersController = new Coupons();
module.exports = ordersController;