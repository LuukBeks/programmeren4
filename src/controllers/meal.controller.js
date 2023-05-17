const database = require("../util/inmem-db");
const logger = require("../util/utils").logger;
const assert = require("assert");
const pool = require("../util/database");

const mealController = {
  // uc 301 Aanmaken van een maaltijd
  createMeal: (req, res, next) => {},

  // uc 302 Wijzigen van maaltijdgegevens
  updateMeal: (req, res, next) => {},

  // uc 303 opvragen van alle maaltijden
  getAllMeals: (req, res, next) => {
    logger.info("Get all meals");

    let sqlStatement = "SELECT * FROM `meal`";
    // Hier wil je misschien iets doen met mogelijke filterwaarden waarop je zoekt.
    if (req.query.isactive) {
      // voeg de benodigde SQL code toe aan het sql statement
      // bv sqlStatement += " WHERE `isActive=?`"
    }
    logger.info("sqlStatement", sqlStatement);
    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code,
        });
      }
      if (conn) {
        conn.query(sqlStatement, function (err, results, fields) {
          if (err) {
            logger.err(err.message);
            next({
              code: 409,
              message: err.message,
            });
          }
          if (results) {
            logger.info("Found", results.length, "results");
            res.status(200).json({
              statusCode: 200,
              message: "Meal getAll endpoint",
              data: results,
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 304 opvragen van een maaltijd bij id
  getMealById: (req, res, next) => {},

  // uc 305 verwijderen van een maaltijd bij id
  deleteMeal: (req, res, next) => {
    const mealId = req.params.mealId;
    const userId = req.user.userId;
    logger.trace("Deleting meal by id = ", mealId, "by user", userId);
    let sqlStatement = "DELETE FROM `meal` WHERE `id`=? AND `cookid`=?";
    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code,
        });
      }
      if (conn) {
        conn.query(
          sqlStatement,
          [mealId, userId],
          function (err, results, fields) {
            if (err) {
              logger.error(err.message);
              next({
                code: 409,
                message: err.message,
              });
            }
            if (results && results.affectedRows > 0) {
              logger.trace(results);
              logger.info("Found", results.length, "results");
              res.status(200).json({
                statusCode: 200,
                message: "Meal with id: " + mealId + " deleted",
                data: results,
              });
            } else {
              logger.info("not authorized to delete meal with id: " + mealId);
              res.status(401).json({
                statusCode: 401,
                message: "not authorized to delete meal with id: " + mealId,
                data: results,
              });
            }
          }
        );
        pool.releaseConnection(conn);
      }
    });
  },
};

module.exports = mealController;
