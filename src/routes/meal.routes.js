const express = require("express");
const router = express.Router();
const mealController = require("../controllers/meal.controller");
const authController = require("../controllers/auth.controller");

// UC-201 Registreren als nieuwe user
router.get("", mealController.getAllMeals);

router.delete("/:mealId", authController.validateToken, mealController.deleteMealById);

module.exports = router;
