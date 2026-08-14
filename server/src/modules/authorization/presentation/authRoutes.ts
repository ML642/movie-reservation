const express = require("express")
const router = express.Router();

const authController = require('../../../../controllers/authController');
const authMiddleware = require('../')

router.post("/register",authController.register)

router.post("/login",authController.login)

router.get("/test",authController.test)

router.patch("/changeInfo",authMiddleware,authController.changeInfo)

module.exports=router;
