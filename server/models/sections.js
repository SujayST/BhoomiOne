const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const sectionSchema = new mongoose.Schema(
  {
    secName: {
      type: String,
      required: true,
    },
    secDescription: {
      type: String,
      required: true,
    },
    secImage: {
      type: String,
    },
    secStore: {
      type: ObjectId,
      ref: "stores",
    },
    url: {
      type: String,
    },
    secStatus: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const sectionModel = mongoose.model("sections", sectionSchema);
module.exports = sectionModel;
