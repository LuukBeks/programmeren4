const express = require("express");
const router = express.Router();
const mealController = require("../controllers/meal.controller");
const authController = require("../controllers/auth.controller");

router.post("", authController.validateToken, mealController.createMeal);

router.put("/:mealId", authController.validateToken, mealController.updateMeal);

router.get("", mealController.getAllMeals);

router.get("/:mealId", mealController.getMealById);

router.delete("/:mealId", authController.validateToken, mealController.deleteMeal);

module.exports = router;
