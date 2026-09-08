const express = require("express");
const router = express.Router();
const multer = require("multer");
const { loginCheck, isAdmin } = require("../middleware/auth");
const blogsController = require("../controller/blogs")

// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "./public/uploads/blogs");
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + "_" + file.originalname);
//     },
// });

const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

router.get("/all-blogs",blogsController.getAllBlogs);
router.post("/add-blog",loginCheck, isAdmin ,upload.single("bImage"),blogsController.postAddBlog);
router.post("/edit-blog", loginCheck, isAdmin, blogsController.postEditBlog);
router.post("/delete-blog",loginCheck, isAdmin, blogsController.getDeleteBlog);

module.exports = router;