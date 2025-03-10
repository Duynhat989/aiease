const express = require("express");
const router = express.Router();
const aieaseController = require("../controllers/aieaseController.js");
const auth = require('../middlewares/authMiddleware.js');

// Lấy danh sách cài đặt
router.get("/aiease/session", auth([1,3]), aieaseController.getSessionController);
router.post("/aiease/t2i", auth([1,3]), aieaseController.createImage);
router.post("/aiease/apply-ai-filters", auth([1,3]), aieaseController.applyAiFilters);
router.post("/aiease/generate-headshot", auth([1,3]), aieaseController.generateHeadshot);
router.post("/aiease/enhance-photo", auth([1,3]), aieaseController.enhancePhoto);
router.post("/aiease/restore-photo", auth([1,3]), aieaseController.restorePhoto);
router.post("/aiease/blur-image-background", auth([1,3]), aieaseController.blurImageBackground);
router.post("/aiease/get_task", auth([1,3]), aieaseController.getTask);

module.exports = router;
