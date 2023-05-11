const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// UC-201 Registreren als nieuwe user
router.post("/api/user", userController.createUser);

// UC-202 Ophalen van alle users
router.get("/api/user", userController.getAllUsers);

// UC-203 Ophalen van gebruikersprofiel
router.get("/api/user/profile", userController.getUserProfile);

// UC-204 Ophalen van gebruikersprofiel op basis van id
router.get("/api/user/:id", userController.getUserProfileById);

// UC-205 Wijzigen van gebruikersprofiel
router.put("/api/user/:id", userController.updateUserProfile);

// UC-206 Verwijderen van gebruikersprofiel
router.delete("/api/user/:id", userController.deleteUser);

module.exports = router;