var express = require("express");
var app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
var cors = require("cors");
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require("./config/keys");

// Import Router
const authRouter = require("./routes/auth");
const categoryRouter = require("./routes/categories");
const sectionRouter = require("./routes/sections");
const storeSectionRouter = require("./routes/storeSections");
const storeRouter = require("./routes/stores");
const selectStoreRouter = require("./routes/selectStores");
const testimonialsRouter =require("./routes/testimonials");
const blogsRouter =require("./routes/blogs");
const productRouter = require("./routes/products");
const brainTreeRouter = require("./routes/braintree");
const orderRouter = require("./routes/orders");
const usersRouter = require("./routes/users");
const customizeRouter = require("./routes/customize");
const paymentRouter = require("./routes/payments");
const affiliateRouter = require("./routes/affiliate");
const couponRouter = require("./routes/coupons");
const cartRouter = require("./routes/cart");
const forgotPasswordRouter = require("./routes/forgotPassword");
const aiRouter = require("./routes/aiAssistant");

// Import Auth middleware for check user login or not~
const { loginCheck } = require("./middleware/auth");
const googleController = require("./controller/authgoogle");

const allowedOrigins = [
  'http://localhost:3000', 
  process.env.BACKEND_API_ADDRESS, 
  process.env.REACT_APP_API_URL,
  "https://thredit.in", 
  "http://127.0.0.1"
];

// Use CORS middleware to handle cross-origin requests
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl) or any origin in dev
      callback(null, true);
    },
    credentials: true, // Enables Access-Control-Allow-Credentials
  })
);

// Database Connection
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() =>
    console.log("==============Mongodb Database Connected Successfully==============")
  )
  .catch((err) =>{
    console.log("Database Not Connected !!! \n Error:");
    console.log(err);
  });

// Middleware
app.use(morgan("dev"));
app.use(function(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json,Authorization,token,authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Check if the user is logged in
app.get("/api/check-is-logged-in", (req, res) => {
  if (req.cookies.token)
    return res.status(200).json({ "loggedIn": true });
  return res.status(404).json({ "loggedIn": false });
});

// Google Auth Routes
app.get(`/auth/google`, googleController.generateUser);
app.get("/api/auth/me", googleController.userAuth);
app.get("/api/auth/logout", googleController.logoutUser);

// Routes
app.use("/api", authRouter);
app.use("/api/user", usersRouter);
app.use("/api/category", categoryRouter);
app.use("/api/storeSection", storeSectionRouter);
app.use("/api/section", sectionRouter);
app.use("/api/store", storeRouter);
app.use("/api/selectStore", selectStoreRouter);
app.use("/api/testimonial", testimonialsRouter);
app.use("/api/blog", blogsRouter);
app.use("/api/product", productRouter);
app.use("/api", brainTreeRouter);
app.use("/api/order", orderRouter);
app.use("/api/customize", customizeRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/cart", cartRouter);
app.use("/api/forgotPassword", forgotPasswordRouter);
app.use("/api/affiliate", affiliateRouter);
app.use("/api/ai", aiRouter);

// Run Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("Server is running on ", PORT);
});