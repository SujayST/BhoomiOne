const express = require("express");
const router = express.Router();
const multer = require("multer");
const { loginCheck } = require("../middleware/auth");
const testimonialsController = require("../controller/testimonials")

const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

router.get("/all-testimonials", testimonialsController.getAllTestimonials);
router.post("/store-testimonials",testimonialsController.getStoreTestimonials)
router.post(
  "/add-testimonial",
  loginCheck,
  upload.single("tImage"),
  testimonialsController.postAddTestimonial
);
router.post("/edit-testimonial", loginCheck, testimonialsController.postEditTestimonial);
router.post(
  "/delete-testimonial",
  loginCheck,
  testimonialsController.getDeleteTestimonial
);

module.exports = router;