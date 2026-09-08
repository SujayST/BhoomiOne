const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      index: { unique: true },
      match: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
    },
    password: {
      type: String,
    },
    userRole: {
      type: Number,
      required: true,
      // 0 : normal user, 1 : Admin, 2 : superAdmin
    },
    mobile: {
      type: Number,
    },
    userImage: {
      type: String,
      default: "user.png",
    },
    verified: {
      type: String,
      default: false,
    },
    secretKey: {
      type: String,
      default: null,
    },
    history: {
      type: Array,
      default: [],
    },

    savedAddress: [
      {
        receiverName: {
          type: String,
          required: true
        },
        receiverContactNumber: {
          type: Number,
          required: true,
        },
        receiverAddress: {
          type: String,
          required: true
        },
        receiverCity: {
          type: String,
          required: true
        },
        receiverDistrict: {
          type: String,
          required: true
        },
        receiverState: {
          type: String,
          required: true
        },
        receiverPincode: {
          type: Number,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
