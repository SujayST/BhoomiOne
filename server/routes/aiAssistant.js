const express = require("express");
const router = express.Router();
const aiAssistantController = require("../controller/aiAssistant");

router.post("/ask", aiAssistantController.handleFarmerQuery);
router.get("/topics", aiAssistantController.getFeaturedTopics);

module.exports = router;

