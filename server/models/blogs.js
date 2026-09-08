const mongoose = require("mongoose");

const blogsSchema = new mongoose.Schema(
  {
    bName: {
      type: String,
      required: true,
    },
    bDescription: {
      type: String,
      required: true,
    },
    url: {
      type: Array,
    },
    bImage: {
      type: String,
    },
  },
  { timestamps: true }
);

const blogsModel = mongoose.model("blogs", blogsSchema);
module.exports = blogsModel;
