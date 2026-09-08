const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const userCouponTrackSchema = new mongoose.Schema(
    {
        user:{
            type:ObjectId,
            ref:"users"
        },
        couponsUsed:[
            {
                couponId:{
                    type:ObjectId,
                    ref:"coupon"
                },
                usedForOrderId:[{type:ObjectId,ref:"orders"}]
            }
        ],        
    },
    { timestamps: true }
);

const userCouponTrackModel = mongoose.model("userCouponTrack", userCouponTrackSchema);
module.exports = userCouponTrackModel;
