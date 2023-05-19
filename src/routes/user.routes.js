const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");

// UC-201 Registreren als nieuwe user
router.post("", userController.createUser);

// UC-202 Ophalen van alle users
router.get("", userController.getAllUsers);

// UC-203 Ophalen van gebruikersprofiel
router.get("/profile", authController.validateToken, userController.getUserProfile,);

// UC-204 Ophalen van gebruikersprofiel op basis van id
router.get("/:id", authController.validateToken, userController.getUserProfileById);

// UC-205 Wijzigen van gebruikersprofiel
router.put("/:id", authController.validateToken, userController.updateUserProfile);

// UC-206 Verwijderen van gebruikersprofiel
router.delete("/:id", authController.validateToken, userController.deleteUser);

module.exports = router;
