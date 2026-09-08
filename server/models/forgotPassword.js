const mongoose = require("mongoose")

const forgotPasswordSchema = new mongoose.Schema({
    uniqueGeneratedId : {
        type:String,
        required : true,
    },
    userEmail : {
        type:String,
        required:true,
    },
    timeToLive :{
        type:Date,
        default:Date.now(),
        expires:3600
    },
})

const forgotPasswordModel = mongoose.model("forgotPassword1", forgotPasswordSchema);
module.exports = forgotPasswordModel;