const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const storeCouponTrackSchema = new mongoose.Schema(
    {
        storeId: {
            type: ObjectId,
            ref: "stores"
        },
        coupons: [
            {
                couponId: {
                    type: ObjectId,
                    ref: "coupon"
                },
                numberOfTImesUsed: Number,
            }
        ],


        //add new fields here for analysis purpose from store perspective


    },
    { timestamps: true }
);

const storeCouponTrackModel = mongoose.model("storeCouponTrack", storeCouponTrackSchema);
module.exports = storeCouponTrackModel;
