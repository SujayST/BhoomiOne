const { toTitleCase, validateEmail } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
const storeModel = require("../models/stores");
const mongoose = require("mongoose");
const { log } = require("console");

class Auth {
  async isAdmin(req, res) {
    let { loggedInUserId } = req.body;
    try {
      let loggedInUserRole = await userModel.findById(loggedInUserId);
      res.json({ role: loggedInUserRole.userRole });
    } catch {
      res.status(404);
    }
  }

  async allUser(req, res) {
    try {
      let allUser = await userModel.find({});
      res.json({ users: allUser });
    } catch {
      res.status(404);
    }
  }

  /* User Registration/Signup controller  */

  async postSignup(req, res) {
    let { fullname, email, password, cPassword } = req.body;
    let error = {};
    if (!fullname || !email || !password || !cPassword) {
      error = {
        ...error,
        fullname: "Filed must not be empty",
        email: "Filed must not be empty",
        password: "Filed must not be empty",
        cPassword: "Filed must not be empty",
      };
      return res.json({ error });
    }
    if (fullname.length < 3 || fullname.length > 25) {
      error = { ...error, fullname: "Name must be 3-25 charecter" };
      return res.json({ error });
    } else {
      if (validateEmail(email)) {
        fullname = toTitleCase(fullname);
        if ((password.length > 255) | (password.length < 8)) {
          error = {
            ...error,
            password: "Password must be 8 charecter",
            fullname: "",
            email: "",
          };
          return res.json({ error });
        } else {
          // If Email & Number exists in Database then:
          try {
            password = bcrypt.hashSync(password, 10);
            const data = await userModel.findOne({ email: email });
            if (data) {
              error = {
                ...error,
                password: "",
                fullname: "",
                email: "Email already exists",
              };
              return res.json({ error });
            } else {
              let newUser = new userModel({
                fullname,
                email,
                password,
                // ========= Here role 1 for admin signup role 0 for customer signup =========
                userRole: 0, // Field Name change to userRole from role
              });
              newUser
                .save()
                .then((data) => {
                  return res.json({
                    success: "Account create successfully. Please login",
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          } catch (err) {
            console.log(err);
          }
        }
        
      } else {
        error = {
          ...error,
          password: "",
          name: "",
          email: "Email is not valid",
        };
        return res.json({ error });
      }
    }
  }
  async postSignupApp( req, res) {
    let { name, email, mobile} = req.body;
    console.log("body:", req.body);
    const fullname = toTitleCase(name);
    try {
        var data = await userModel.findOne({ mobile: mobile });
        
        if (data) {
            console.log("Phone number already exists"); 
        } else {
            let newUser = new userModel({
                fullname,
                email,
                mobile: mobile,
                userRole: 0, // Field Name change to userRole from role
            });
            newUser
                .save()
                .then((data) => {
                    console.log("Account create successfully.")
                    return res.json({
                      success: "Account created successfully.",
                    });
                })
                .catch((err) => {
                console.log(err);
                });
        }
    } catch (err) {
        console.log(err);
    }
}


  
  /* User Login/Signin controller  */
  async postSignin(req, res) {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        error: "Fields must not be empty",
      });
    }
    try {
      const data = await userModel.findOne({ email: email });
      if (!data) {
        return res.json({
          error: "Invalid email or password",
        });
      } else {
        try{
          const login = await bcrypt.compare(password, data.password);
          if (login) {
            const token = jwt.sign(
              { _id: data._id, role: data.userRole },
              JWT_SECRET
            );
            res.cookie('token', token, {
              httpOnly: true,    
              secure: true,      
              sameSite: 'Lax' ,
              maxAge : 10*60*60*1000
            });
            console.log("cookieee : ",res.cookie)
            return res.json({
              token: token,
            });
          } else {
            return res.json({
              error: "Invalid email or password",
            });
          }
        } catch (err) {
          return res.json({
            error: "Please login using Google Auth",
          });
        }
        
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getStoreAdmin(req, res) {
    const adminId = req.adminId;
    try {
    let store = await storeModel.find({"Admin" : adminId})
    if (store.length > 0) {
      let storeNames = store.map(st => st.sName);  // Extract all sName values
      console.log("Store Names:", storeNames);  // Debugging
      return res.json({ isAdmin: true, storeNames: storeNames });
    }
    else{
      return res.json({ isAdmin: false });
    }
  }
  catch (err) {
    console.log(err);
    return res.json({ error: err});
  }
  }

  async getSuperAdmin(req, res) {
    let superAdminId = req.superAdminId;
    console.log("getSuperAdmin:", superAdminId);
    try{
      let user = await userModel.findOne({"_id" : superAdminId})
      if (!user) {
        // If no user is found, return an error response
        return res.json({ isSuperAdmin: false, message: "User not found" });
      }
      // Check if the user's role is super admin (userRole === 2)
      if (user.userRole === 2) {
        return res.json({ isSuperAdmin: true });
      } else {
        return res.json({ isSuperAdmin: false });
      }

    }
    catch(error){
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

const authController = new Auth();
module.exports = authController;
