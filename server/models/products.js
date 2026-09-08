const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const sizeSchema = new mongoose.Schema({
  size: String,
  quantity: Number,
});

const productSchema = new mongoose.Schema(
  {
    pName: {
      type: String,
      required: true,
    },
    pDescription: {
      type: String,
      required: true,
    },
    pPrice: {
      type: Number,
      required: true,
    },
    pSold: {
      type: Number,
      default: 0,
    },
    pQuantity: {
      type: String,
    },
    pCategory: {
      type: ObjectId,
      ref: "categories",
    },
    pSection: {
      type: ObjectId,
      ref: "sections",
    },
    pStore: {
      type: ObjectId,
      ref: "stores",
    },
    pImages: {
      type: Array,
      required: true,
    },
    url: {
      type: Array,
    },
    pOffer: {
      type: String,
      default: null,
    },
    similarProducts:{
      type: String,
    },
    pRatingsReviews: [
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
    pStatus: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const productModel = mongoose.model("products", productSchema);
module.exports = productModel;
