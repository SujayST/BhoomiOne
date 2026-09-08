const express = require("express");
const router = express.Router();
const usersController = require("../controller/users")
const multer = require("multer");
const { loginCheck, isSuperAdmin } = require("../middleware/auth");
const selectStoreController = require("../controller/selectStores");

const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

router.get("/all-store", selectStoreController.getAllStore);
// router.post("/single-store", storeController.getStore);
router.post("/add-quadrant",loginCheck,isSuperAdmin,upload.any(),selectStoreController.postAddQuadrant,usersController.changeRoleOfUser);
// router.post("/edit-", loginCheck,isSuperAdmin,upload.single("editImage"), selectStoreController.postEditStore);
router.post("/delete-store",loginCheck,isSuperAdmin,selectStoreController.getDeleteStore);
router.post("/store-by-storeSection", selectStoreController.getStoreByStoreSection);
module.exports = router;
