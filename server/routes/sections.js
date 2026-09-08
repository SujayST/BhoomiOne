const express = require("express");
const router = express.Router();
const multer = require("multer");
const { loginCheck,isAdmin } = require("../middleware/auth");
const sectionController = require("../controller/sections");

const storage = multer.memoryStorage()
const upload = multer({ storage: storage });
router.get("/all-section", sectionController.getAllSection);
router.post("/section-by-store", sectionController.getSectionByStore);
router.post("/add-section",loginCheck,isAdmin,upload.single("secImage"),sectionController.postAddSection);
router.post("/edit-section", loginCheck,isAdmin, sectionController.postEditSection);
router.post("/delete-section",loginCheck,isAdmin,sectionController.getDeleteSection);

module.exports = router;
