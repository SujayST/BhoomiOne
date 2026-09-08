const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categories");
const multer = require("multer");
const { loginCheck,isAdmin } = require("../middleware/auth");

const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

router.get("/all-category", categoryController.getAllCategory);
router.post("/category-by-store", categoryController.getCategoryByStore);
router.post("/category-by-section", categoryController.getCategoryBySection);
router.post("/add-category",loginCheck,isAdmin,upload.single("cImage"),categoryController.postAddCategory);
router.post("/edit-category", loginCheck,isAdmin, categoryController.postEditCategory);
router.post("/delete-category",loginCheck,isAdmin,categoryController.getDeleteCategory);

module.exports = router;
