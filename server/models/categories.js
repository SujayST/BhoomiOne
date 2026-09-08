const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const categorySchema = new mongoose.Schema(
  {
    cName: {
      type: String,
      required: true,
    },
    cDescription: {
      type: String,
      required: true,
    },
    cImage: {
      type: String,
    },
    cImages: {
      type: Array,
      default: [],
    },
    cStore: {
      type: ObjectId,
      ref: "stores",
    },
    cSection: {
      type: ObjectId,
      ref: "sections",
    },
    url: {
      type: String,
    },
    urls: {
      type: Array,
      default: [],
    },
    cStatus: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const categoryModel = mongoose.model("categories", categorySchema);
module.exports = categoryModel;
