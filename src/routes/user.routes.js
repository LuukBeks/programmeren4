const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// UC-201 Registreren als nieuwe user
router.post("", userController.createUser);

// UC-202 Ophalen van alle users
router.get("", userController.getAllUsers);

// UC-203 Ophalen van gebruikersprofiel
router.get("/profile", userController.getUserProfile);

// UC-204 Ophalen van gebruikersprofiel op basis van id
router.get("/:id", userController.getUserProfileById);

// UC-205 Wijzigen van gebruikersprofiel
router.put("/:id", userController.updateUserProfile);

// UC-206 Verwijderen van gebruikersprofiel
router.delete("/:id", userController.deleteUser);

module.exports = router;
