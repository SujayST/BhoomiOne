const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
const userModel = require("../models/users");
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

exports.loginCheck = async (req, res, next) => {
  let token = null;

  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    } else {
      token = req.headers.authorization;
    }
  } else if (req.headers && req.headers.token) {
    token = req.headers.token;
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      error: "You must be logged in",
    });
  }

  try {
    const decode = jwt.verify(token, JWT_SECRET);
    req.userDetails = decode;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "You must be logged in",
    });
  }
};

exports.getUrl = async(storeImageKey)=>{
  var getObjectParams ={
    Bucket: process.env.BUCKET_NAME,
    Key: storeImageKey,
  }
  var command = new GetObjectCommand(getObjectParams);
  var url = await getSignedUrl(s3Client, command);
  return url;
}
exports.isAuth = (req, res, next) => {
  let { loggedInUserId } = req.body;
  if (
    !loggedInUserId ||
    !req.userDetails._id ||
    loggedInUserId != req.userDetails._id
  ) {
    res.status(403).json({ error: "You are not authenticate" });
  }
  next();
};

// exports.isAdmin = async (req, res, next) => {
//   try {
//     let reqUser = await userModel.findById(req.body.loggedInUserId);
//     // If user role 0 that's mean not admin it's customer
//     if (reqUser.userRole === 0) {
//       res.status(403).json({ error: "Access denied" });
//     }
//     next();
//   } catch {
//     res.status(404);
//   }
// };

exports.isAdmin = async (req, res, next) => {
  try {
    let reqUser = await userModel.findById(req.userDetails._id);
    if (!reqUser || reqUser.userRole === 0) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  } catch (err){
    return res.status(403).json({
      error: "You must be an admin",
    });
  }
};

exports.isSuperAdmin = async (req, res, next) => {
  try {
    let reqUser = await userModel.findById(req.userDetails._id);
    if (!reqUser || reqUser.userRole !== 2) {
      return res.status(403).json({ error: "Access denied: Super Admin role required" });
    }
    next();
  } catch (err){
    return res.status(403).json({
      error: "You must be a super admin",
    });
  }
};


exports.verifyStoreAdmin = (req, res, next) => {
  try {
    req.adminId = req.userDetails._id;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    console.log("Token verification failed:", error);
    return res.status(401).json({ error: 'Unauthorized access' });
  }
};


exports.verifySuperAdmin = (req, res, next) => {
  try {
    console.log("line_101");
    if(req && req.userDetails){
    req.superAdminId = req.userDetails._id;
    // Proceed to the next middleware or route handler
    next();
    }
  } catch (error) {
    console.error("Token verification failed:", error);
    console.log("Token verification failed:", error);
    return res.status(401).json({ error: 'Unauthorized access 101' });
  }
};

