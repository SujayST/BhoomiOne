const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const storeSchema = new mongoose.Schema(
  {
    sName: {
      type: String,
      required: true,
    },
    sDescription: {
      type: String,
      required: true,
    },
    sImage: {
      type: String,
    },
    sSignature: {
      type: String,
    },
    sLogo: {
      type: String,
    },
    sSection: {
      type: ObjectId,
      ref: "storeSections",
    },
    url: {
      type: String,
    },
    sStatus: {
      type: String,
      required: true,
    },
    sRatingsReviews: [
      {
        review: String,
        user: { type: ObjectId, ref: "users" },
        rating: String,
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    Admin: { 
      type: ObjectId, 
      ref: "users"
    },
    GST:{
      type: String,
    },
    sAddress: { type: String},
    sPincode: { type: Number},
    commisionRate:{type: Number},
    sInvoceCount:{type: Number},
  },

  { timestamps: true }
);

const storeModel = mongoose.model("stores", storeSchema);
module.exports = storeModel;
