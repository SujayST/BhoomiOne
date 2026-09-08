const express = require("express");
const router = express.Router();
const multer = require("multer");
const { loginCheck,isAdmin } = require("../middleware/auth");
const storeSectionController = require("../controller/storeSections");

const storage = multer.memoryStorage()
const upload = multer({ storage: storage });
router.get("/all-storeSection", storeSectionController.getAllStoreSection);
router.post("/add-storeSection",loginCheck,isAdmin,upload.single("ssImage"),storeSectionController.postAddStoreSection);
router.post("/edit-storeSection", loginCheck,isAdmin, storeSectionController.postEditStoreSection);
router.post("/delete-storeSection",loginCheck,isAdmin,storeSectionController.getDeleteStoreSection);

module.exports = router;
