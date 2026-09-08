const express = require("express");
const router = express.Router();
const customizeController = require("../controller/customize");
const multer = require("multer");
const { loginCheck, isAdmin, isSuperAdmin } = require("../middleware/auth");
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

router.get("/get-slide-image", customizeController.getImages);
router.get("/get-slide-image-mobile", customizeController.getImagesMobile);
router.post("/get-store-slide-image", customizeController.getImagesByStore);
router.post("/get-store-slide-image-mobile", customizeController.getImagesMobileByStore);
router.post("/delete-slide-image",loginCheck,isAdmin, customizeController.deleteSlideImage);
router.post("/upload-slide-image",loginCheck,isAdmin,upload.single("image"),customizeController.uploadSlideImage);
router.post("/dashboard-data", loginCheck, isSuperAdmin, customizeController.getAllData);
router.get("/dashboard-data", loginCheck, isSuperAdmin, customizeController.getAllData);

module.exports = router;
