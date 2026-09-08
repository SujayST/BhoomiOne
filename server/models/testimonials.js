const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const testimonialsSchema = new mongoose.Schema(
  {
    tName: {
      type: String,
      required: true,
    },
    tDescription: {
      type: String,
      required: true,
    },
    tImage: {
      type: String,
    },
    store: {
      type: ObjectId,
      ref: "stores",
      required: true,
    },
    url: {
      type: String,
    }
  },
  { timestamps: true }
);

const testimonialsModel = mongoose.model("testimonials", testimonialsSchema);
module.exports = testimonialsModel;
