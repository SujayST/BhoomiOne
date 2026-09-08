const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const selectStoreSchema = new mongoose.Schema(
  {
    sectionName: {
      type: Number,
      required: true,
    },
    store1: {
      type: ObjectId,
      ref: "stores",
    },
    store2: {
      type: ObjectId,
      ref: "stores",
    },
    store3: {
      type: ObjectId,
      ref: "stores",
    },
    store4: {
      type: ObjectId,
      ref: "stores",
    },
    sStatus: {
      type: String,
      required: true,
    },
  },

  { timestamps: true }
);

const selectStoreModel = mongoose.model("selectStores", selectStoreSchema);
module.exports = selectStoreModel;
