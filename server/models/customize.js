const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const customizeSchema = new mongoose.Schema(
  {
    slideImage: {
      type: String,
    },
    device:{
      type: String,
      default: "desktop",
    },
    cStore:{
      type: ObjectId,
      ref:"stores",
    },
    firstShow: {
      type: Number,
      default: 0,
    },
    url: {
      type:String,
    },

  },
  { timestamps: true }
);

const customizeModel = mongoose.model("customizes", customizeSchema);
module.exports = customizeModel;
