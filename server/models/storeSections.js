const mongoose = require("mongoose");

const storeSectionSchema = new mongoose.Schema(
  {
    ssName: {
      type: String,
      required: true,
    },
    ssDescription: {
      type: String,
      required: true,
    },
    ssImage: {
      type: String,
    },
    url: {
      type: String,
    },
    ssStatus: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const storeSectionModel = mongoose.model("storeSections", storeSectionSchema);
module.exports = storeSectionModel;
