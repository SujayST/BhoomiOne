const express = require("express");
const router = express.Router();
const affiliateController = require("../controller/affiliate")


router.post("/set-affiliate-data", affiliateController.setAffiliateData);
router.post('/generate-affiliate-link', affiliateController.getAffiliateLinkForProduct);
router.post("/get-affiliate-details", affiliateController.getAffiliateDetails);


module.exports = router;
