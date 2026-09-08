const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const orderSchema = new mongoose.Schema(
  {
    allProduct: [
      {
        id: { type: ObjectId, ref: "products" },
        quantitiy: Number,
        subtotal: Number,
        size: String
      },
    ],
    user: {
      type: ObjectId,
      ref: "users",
      required: true,
    },
    store: {
      type: ObjectId,
      ref: "stores",
      required: true,
    },
    amount: {
      type: Number,
    },
    transactionDetails: {
      type: Array,
      required: true,
    },
    shippingDetails: {
      waybill: { type: String },
      upload_wbn: { type: String },
      ref_num:{type: String}
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    invoiceKey: {
      type: String,
    },
    invoiceUrl: {
      type: String,
    },
    status: {
      type: String,
      default: "Not processed",
      enum: [
        "Not processed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
        "Return Requested"
      ],
    },
  },
  { timestamps: true }
);

const orderModel = mongoose.model("orders", orderSchema);
module.exports = orderModel;