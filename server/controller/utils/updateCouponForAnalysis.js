
    const storeCouponTrackModel = require('../../models/utils/storeCouponTrack')

    class CouponForAnalysisByStore {
        async updateCouponCount(storeId, coupon) {
            try {
                // First attempt to update the existing coupon entry
                const result = await storeCouponTrackModel.findOneAndUpdate(
                    { storeId, "coupons.couponId": coupon._id },
                    {
                        $inc: { "coupons.numberOfTImesUsed": 1 } // Increment the count for the specific coupon
                    },
                    {
                        new: true, // Return the updated document
                        upsert: true // Create the document if it does not exist
                    }
                ).exec();
                if (result)
                    return result
            }
            catch (err) {
                console.log(err)
            }
        }
    }

    const updateCouponForAnalyis = new CouponForAnalysisByStore()
    module.exports = updateCouponForAnalyis