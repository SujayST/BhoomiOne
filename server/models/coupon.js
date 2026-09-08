const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const couponSchema = new mongoose.Schema(
    {
        couponName: {
            type: String,
            required: true,
            maxlength: 50,
        },
        couponDescription: {
            type: String,
            required: true,
            trim: true
        },
        applicableStore: {
            type: ObjectId,
            ref: "stores",
        },
        applicableMinimumAmount: {
            type: Number
        },
        applicableDiscountValue: {
            type: Number, required: true
        },
        applicableDiscountType: {
            type: String,
            default: "fixed",
            enum: [
                "fixed",
                "percentage"
            ]
        },
        couponMaximumRedemptions: {
            type: Number,
            default: 1000000000000000,
        },
        couponMaximumRedemptionByIndividualUser: {
            type: Number
        }

        //for further usecases
        // couponExpiryDate :{
        //     type : Timestamp
        // },

        //for future uses
        // couponEligibleProducts :[
        //     {
        //       id: { type: ObjectId, ref: "products" }
        //     },
        //   ],
        //   couponEligibleUsers:[
        //     {
        //         id: { type: ObjectId, ref: "users" }
        //       },
        //   ]
    },
    { timestamps: true }
);

const couponModel = mongoose.model("coupons", couponSchema);
module.exports = couponModel;
