const mongoose = require('mongoose');
const { type } = require('os');
const { ObjectId } = mongoose.Schema.Types;

const cartSchema = new mongoose.Schema({
    userId : {
        type : ObjectId,
        ref : "users",
        required : true,
    },
    cartProducts : [
       { 
            productId : {
                type : ObjectId,
                ref : "products",
                required : true
            },
            productSize : {
                type:String,
                required:true
            },
            productQuantity : {
                type:Number,
                required:true
            },
            url: {
                type: Array,
            },
            productPrice:{
                type:Number,
                required:true,
            },
            productStoreId:{
                type:ObjectId,
                ref:"stores",
                required:true,
            },
            productPhotoUrl:{
                type:String,
                required:true,
            },
            productName : {
                type:String,
                required:true,
            },
            storeName : {
                type:String,
            }
        }
    ],
    wishlistProducts :[
        {
            productId : {
                type:ObjectId,
                ref:"products",
            }
        }
    ]
})

const cartModel = mongoose.model("cart", cartSchema);
module.exports = cartModel;

