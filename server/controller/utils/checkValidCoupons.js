const userCouponTrackModel = require("../../models/utils/userCouponTrack")
const mongoose = require('mongoose');


class CheckValidCouponsForUser {

    async checkIfUserHasUtilisedMaximumNumberOfTimes(coupons, userId) {

        const user = mongoose.Types.ObjectId(userId);

        try {
            const userDoc = await userCouponTrackModel.findOne({ user }).exec();

            if (!userDoc) {
                return coupons;
            }
            const usedCoupons = userDoc.couponsUsed;
            const couponUseCount = {};

            usedCoupons.forEach(entry => {
                const couponId = entry.couponId;
                if (couponUseCount[couponId]) {
                    couponUseCount[couponId]++;
                } else {
                    couponUseCount[couponId] = 1;
                }
            });

            const availableCoupons = coupons.filter(coupon => {
                const useCount = couponUseCount[coupon._id] || 0;
                return useCount < coupon.couponMaximumRedemptionByIndividualUser;
            });

            return availableCoupons;

        } catch (err) {
            console.error("Error checking coupon utilization:", err);
            throw err;
        }
    }

    async addCouponsUsedToDb(coupon, userId, orderId) {
        try {
            const result = await userCouponTrackModel.findOneAndUpdate(
                { user: userId },
                {
                    $push: {
                        couponsUsed: {
                            couponId: coupon._id,
                            usedForOrderId: orderId
                        }
                    }
                },
                {
                    new: true,
                    upsert: true
                }
            );

            return result;
        } catch (error) {
            console.error("Error updating or creating user coupon track:", error);
            throw error;
        }
    }

}

const checkValidCoupons = new CheckValidCouponsForUser()
module.exports = checkValidCoupons