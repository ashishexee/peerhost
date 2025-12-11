const express = require("express");
const getController = require("../controller/get-controller");
const router = express.Router();

router.get("/get-request",getController);

module.exports = router;
