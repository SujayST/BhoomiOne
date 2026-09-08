const express = require("express");
const router = express.Router();
const storeController = require("../controller/stores");
const usersController = require("../controller/users")
const multer = require("multer");
const { loginCheck, isSuperAdmin } = require("../middleware/auth");

const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

router.get("/all-store", storeController.getAllStore);
router.post("/single-store", storeController.getStore);
router.post("/add-store",loginCheck,isSuperAdmin,upload.any(),storeController.postAddStore,usersController.changeRoleOfUser);
router.post("/edit-store", loginCheck,isSuperAdmin,upload.single("editImage"), storeController.postEditStore);
router.post("/delete-store",loginCheck,isSuperAdmin,storeController.getDeleteStore);
router.post("/store-by-storeSection", storeController.getStoreByStoreSection);
module.exports = router;
