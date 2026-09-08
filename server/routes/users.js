const express = require("express");
const router = express.Router();
const usersController = require("../controller/users");

const {loginCheck,isSuperAdmin} = require("../middleware/auth")


router.get("/all-user", loginCheck, isSuperAdmin, usersController.getAllUser);
router.post("/all-user", loginCheck, isSuperAdmin, usersController.getAllUser);
router.post("/single-user", loginCheck, usersController.getSingleUser);
router.post("/signle-user", loginCheck, usersController.getSingleUser);
router.get("/single-user", loginCheck, usersController.getSingleUser);
router.post("/check-user", usersController.checkUser);//check


router.post("/add-user", usersController.postAddUser);
router.post("/edit-user", usersController.postEditUser);
router.post("/delete-user", usersController.getDeleteUser);
router.post("/save-address", loginCheck, usersController.saveAddress);
router.get("/get-saved-address", loginCheck, usersController.getSavedAddress);
router.post("/get-saved-address", loginCheck, usersController.getSavedAddress);
router.get("/get-saved-addresses", loginCheck, usersController.getSavedAddress);
router.post("/get-saved-addresses", loginCheck, usersController.getSavedAddress);
router.post("/remove-saved-address", loginCheck, usersController.removeSavedAddress);

router.post("/add-user",loginCheck, usersController.postAddUser);
router.post("/edit-user",loginCheck, usersController.postEditUser);
router.post("/delete-user",loginCheck, usersController.getDeleteUser);


router.post("/change-password",loginCheck, usersController.changePassword);

module.exports = router;
