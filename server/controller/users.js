const userModel = require("../models/users");
const bcrypt = require("bcryptjs");

class User {
  async checkUser(req, res) {
    let { mobile } = req.body;
    mobile = mobile.slice(3, 13);
    console.log("mobile:", mobile);
    const data = await userModel.findOne({ mobile: mobile });
    if (data) {
      return res.json({
        success: data,
      });
    } else {
      return res.json({
        success: false,
      });
    }
  }

  async getAllUser(req, res) {
    try {
      let Users = await userModel
        .find({})
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .sort({ _id: -1 });
      if (Users) {
        return res.json({ Users });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getSingleUser(req, res) {
    let uId = req.userDetails._id;
    if (!uId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let User = await userModel
          .findById(uId)
          .select("fullname email mobile userImage userRole updatedAt createdAt");
        if (User) {
          return res.json({ User });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async postAddUser(req, res) {
    let { allProduct, user, amount, transactionId, address, mobile } = req.body;
    if (
      !allProduct ||
      !user ||
      !amount ||
      !transactionId ||
      !address ||
      !mobile
    ) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        let newUser = new userModel({
          allProduct,
          user,
          amount,
          transactionId,
          address,
          mobile,
        });
        let save = await newUser.save();
        if (save) {
          return res.json({ success: "User created successfully" });
        }
      } catch (err) {
        return res.json({ error: error });
      }
    }
  }

  async postEditUser(req, res) {
    let { uId, name, mobile } = req.body;
    if (!uId || !name || !mobile) {
      return res.json({ message: "All filled must be required" });
    } else {
      let currentUser = userModel.findByIdAndUpdate(uId, {
        name: name,
        mobile: mobile,
        updatedAt: Date.now(),
      });
      currentUser.exec((err, result) => {
        if (err) console.log(err);
        return res.json({ success: "User updated successfully" });
      });
    }
  }

  async getDeleteUser(req, res) {
    let { oId, status } = req.body;
    if (!oId || !status) {
      return res.json({ message: "All filled must be required" });
    } else {
      let currentUser = userModel.findByIdAndUpdate(oId, {
        status: status,
        updatedAt: Date.now(),
      });
      currentUser.exec((err, result) => {
        if (err) console.log(err);
        return res.json({ success: "User updated successfully" });
      });
    }
  }

  async changePassword(req, res) {
    let {  oldPassword, newPassword } = req.body;
    const uId = req.userDetails._id;
    if (!uId || !oldPassword || !newPassword) {
      return res.json({ message: "All filled must be required" });
    } else {
      const data = await userModel.findOne({ _id: uId });
      if (!data) {
        return res.json({
          error: "Invalid user",
        });
      } else {
        const oldPassCheck = await bcrypt.compare(oldPassword, data.password);
        if (oldPassCheck) {
          newPassword = bcrypt.hashSync(newPassword, 10);
          let passChange = userModel.findByIdAndUpdate(uId, {
            password: newPassword,
          });
          passChange.exec((err, result) => {
            if (err) console.log(err);
            return res.json({ success: "Password updated successfully" });
          });
        } else {
          return res.json({
            error: "Your old password is wrong!!",
          });
        }
      }
    }
  }

  async saveAddress(req, res) {
    const userId = req.userDetails._id;
    const { receiverName, receiverContactNumber, receiverAddress, receiverCity, receiverDistrict, receiverState, receiverPincode } = req.body;
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized access" })
    }
    if (!receiverName || !receiverContactNumber || !receiverAddress || !receiverCity || !receiverDistrict || !receiverState || !receiverPincode)
      return res.status(404).json({ err: "Mandatory fields not found" })
    try {
      const savedAddress = await userModel.findByIdAndUpdate(
        { _id: userId },
        {
          $push: {
            savedAddress:
            {
              receiverName,
              receiverContactNumber,
              receiverAddress,
              receiverCity,
              receiverDistrict,
              receiverState,
              receiverPincode
            }

          }
        },
        {
          new: true,
          upsert: true
        }
      );
      if (!savedAddress) {
        return res.status(404).json({ error: "server crasheddd!!!!" })
      }
      return res.status(200).json({success:"Added successfully"})
    } catch (err) {
      console.log(err)
    }
  }

  async removeSavedAddress(req, res) {
    const userId = req.userDetails._id;
    const { savedAddressId } = req.body;
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized access" })
    }
    if (!savedAddressId) {
      return res.status(404).json({ error: "Mandatory fields missing" })
    }
    try {
      const savedAddress = await userModel.findByIdAndUpdate(
        { _id: userId },
        {
          $pull: {
            savedAddress:
            {
              _id: savedAddressId
            }

          }
        },
        {
          new: true,
          upsert: true
        }
      );
      if (!savedAddress) {
        return res.status(404).json({ error: "server crasheddd!!!!" })
      }
      return res.json(savedAddress)
    } catch (err) {
      console.log(err)
    }
  }

  async getSavedAddress(req, res) {

    const userId = req.userDetails._id;

    if (!userId) {
      return res.status(403).json({ error: "Unauthorized access" })
    }
    try {
      const savedAdress = await userModel.findOne({ _id: userId }).exec()
      if (savedAdress) {
        const addressList = savedAdress.savedAddress;
        return res.status(200).json(addressList)
      }
      else {
        return res.status(400).json({ error: "User not found" })
      }
    } catch (err) {
      console.log(err)
      return res.status(500).json({ error: "There was some problem fetching data" })
    }
  }

  async changeRoleOfUser(req,res,next){
    const userId = req.body.Admin;
  
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized access" })
    }
    try{
      const changedRole = await userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { userRole: 1 } },
        { new: true } // This ensures the updated document is returned
      );
      if(changedRole){
        return res.status(200).json({"success" : "Store addedd successfully"})
      }
      return res.status(500).json({"error":"Internal server error"})
  
    }catch(err){
      console.log(err)
      return res.status(500).json({"error":"Internal server error"})
    }
  }

  
}


const ordersController = new User();
module.exports = ordersController;
