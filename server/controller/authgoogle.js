
var querystring = require("querystring");
var axios = require("axios");
const jwt = require('jsonwebtoken');
const { toTitleCase } = require("../config/function");
const userModel = require("../models/users");
const { JWT_SECRET } = require("../config/keys");


function getTokens({
    code,
    clientId,
    clientSecret,
    redirectUri,
  }){
    /*
     * Uses the code to get tokens
     * that can be used to fetch the user's profile
     */
    const url = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    };

    return axios
      .post(url, values, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then((res) => res.data)
      .catch((error) => {
        console.error(`Failed to fetch auth tokens: `+ error);
        // res.status(403).json({ error: true, message: "Not Authorized" });
      });
  }

async function postSignupG( name, email, picture) {

    fullname = toTitleCase(name);
    try {
        var data = await userModel.findOne({ email: email });
        
        console.log("DB_data: " + data)
        if (data) {
            console.log("Email already exists"); 
        } else {
            let newUser = new userModel({
                fullname,
                email,
                picture,
                userRole: 0, // Field Name change to userRole from role
            });
            newUser
                .save()
                .then((data) => {
                    console.log("Account create successfully.")
                })
                .catch((err) => {
                console.log(err);
                });
            data = await userModel.findOne({ email: email });
        }
        return data;
    } catch (err) {
        console.log(err);
    }
}

class GoogleAuth {
    
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
      
    async generateUser (req, res){
        const code = req.query.code;
      
        const data = await getTokens({
          code,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: 'http://localhost:8000/auth/google',
        });
        console.log("data: "+ JSON.stringify(data));
        const {access_token, id_token   } = data
      
        console.log("access_token: "+ access_token + "id_token: "+ id_token)
      
        // Fetch the user's profile with the access token and bearer
        const googleUser = await axios
          .get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
            {
              headers: {
                Authorization: `Bearer ${id_token}`,
              },
            }
          )
          .then((res) => res.data)
          .catch((error) => {
            console.error(`Failed to fetch user`);
            console.log("Error: "+ error)
          });
        console.log("User: "+ JSON.stringify(googleUser));
        const { name, email, picture} = googleUser;
        var user = await postSignupG(name, email, picture);
        console.log("GU_type:"+ JSON.stringify(googleUser));
        console.log("DB_type:"+ JSON. stringify(user));
          
        const token = jwt.sign({ _id: user._id, role: user.userRole }, JWT_SECRET); 
      
        res.cookie(process.env.COOKIE_NAME, token, {
          maxAge: 900000,
          httpOnly: true,
          secure: false,
        });
      
        res.redirect(process.env.UI_ROOT_URI);
      }
  
    /* User Registration/Signup controller  */
  
    userAuth (req, res){
      let { email } = req.body;
        try {
            if(jwt){
            const token= req.cookies[process.env.COOKIE_NAME]
            const encode = jwt.verify(token, JWT_SECRET);
            console.log("token: ", token )
            console.log("decoded", encode);
            return res.json({
                token: token, 
              });
            // return res.send(decoded);
            }
        } catch (err) {
            // console.log("Jwt_error:",err);
            res.send(null);
        }
    }

    logoutUser (req, res){
        console.log("logout succefffull!")
        res.clearCookie('token'); 
        return res.status(200).json({"message":"successful"})
       // req.session.destroy();
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
          const login = await bcrypt.compare(password, data.password);
          if (login) {
            const token = jwt.sign(
              { _id: data._id, role: data.userRole },
              JWT_SECRET
            );
            const encode = jwt.verify(token, JWT_SECRET);
            return res.json({
              token: token,
              user: encode,
            });
          } else {
            return res.json({
              error: "Invalid email or password",
            });
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
}
  
const googleController = new GoogleAuth();
module.exports = googleController;