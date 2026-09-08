// models/affiliateModel.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const affiliateSchema = new mongoose.Schema({
  affiliateId: {
    type: String,
    required: true,
  },
  pId:{
    type:ObjectId,
    ref:"products",
    require:true,
  },
  pPrice: {
    type: Number,
    ref:"products",
    //required: true,
  },
  count: {
    type: Number,
    default: 0 // Initialize count to 1 when a new record is created
  },
  monthlyOrders: { 
    type: Number, 
    default: 0 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  monthlyCommission: { 
    type: Number, 
    default: 0 
  },
},
{ timestamps: true }
);
affiliateSchema.index({ pId: 1, affiliateId: 1 }, { unique: true });

const affiliateModel = mongoose.model('Affiliate', affiliateSchema);
module.exports = affiliateModel;
