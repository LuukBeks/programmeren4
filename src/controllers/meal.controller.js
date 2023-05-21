const logger = require("../util/utils").logger;
const assert = require("assert");
const pool = require("../util/database");
const e = require("express");

const mealController = {
  // uc 301 Aanmaken van een maaltijd
  createMeal: (req, res, next) => {
    const userId = req.userId;
    var currentDate = new Date();
    var dateTime = currentDate.toISOString().slice(0, 19).replace("T", " ");

    logger.info("Create new meal, userId: " + userId);

    // De mealgegevens zijn meegestuurd in de request body.
    const meal = req.body;
    logger.trace("meal = ", meal);

    // Hier kan je binnenkomende meal info kunt valideren.
    try {
      assert(typeof meal.isActive === "number", "isActive must be a number");
      assert(typeof meal.isVega === "number", "isVega must be a number");
      assert(typeof meal.isVegan === "number", "Description must be a number");
      assert(
        typeof meal.isToTakeHome === "number",
        "isToTakeHome must be a number"
      );
      assert(
        typeof meal.maxAmountOfParticipants === "number",
        "maxAmountOfParticipants must be a number"
      );
      assert(typeof meal.price === "string", "Price must be a string");
      assert(typeof meal.imageUrl === "string", "imageUrl must be a string");
      assert(typeof meal.name === "string", "name must be a string");
      assert(
        typeof meal.description === "string",
        "Description must be a string"
      );
      assert(
        typeof meal.allergenes === "string",
        "Allergenes must be a string"
      );
    } catch (err) {
      logger.warn(err.message.toString());
      // Als één van de asserts failt sturen we een error response.
      next({
        status: 400,
        message: "Foute invoer van een of meerdere velden",
        data: {},
      });

      // Nodejs is asynchroon. We willen niet dat de applicatie verder gaat
      // wanneer er al een response is teruggestuurd.
      return;
    }

    let sqlStatement =
      "INSERT INTO `meal` (`isActive`, `isVega`, `isVegan`, `isToTakeHome`, `dateTime`, `maxAmountOfParticipants`, `price`, `imageUrl`, `name`, `description`, `allergenes`, `cookId`) VALUES " +
      "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        conn.query(
          sqlStatement,
          [
            meal.isActive,
            meal.isVega,
            meal.isVegan,
            meal.isToTakeHome,
            dateTime,
            meal.maxAmountOfParticipants,
            meal.price,
            meal.imageUrl,
            meal.name,
            meal.description,
            meal.allergenes,
            userId,
          ],
          (err, results, fields) => {
            if (err) {
              logger.error(err.message);
              next({
                status: 409,
                message: err.message,
              });
              console.log("ERRORCODE: " + err);
              logger.error(
                "ERROR: " + err.status,
                err.syscall,
                err.address,
                err.port
              );
            }
            if (results) {
              const mealId = results.insertId;
              logger.trace("Meal successfully added, id: ", mealId);

              // Retrieve the user details separately
              const sqlUserStatement = "SELECT * FROM user WHERE id=?";
              conn.query(
                sqlUserStatement,
                [userId],
                (err, userResults, fields) => {
                  if (err) {
                    logger.error(err.message);
                    next({
                      status: 409,
                      message: err.message,
                    });
                  }
                  if (userResults && userResults.length > 0) {
                    const user = userResults[0];

                    res.status(201).json({
                      status: 201,
                      message: "Meal created",
                      data: {
                        meal: { mealId, ...meal },
                      },
                    });
                  }
                }
              );
            }
          }
        );
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 302 Wijzigen van maaltijdgegevens
  updateMeal: (req, res, next) => {
    const mealId = req.params.mealId;
    const userId = req.userId;
    logger.info("Update meal by id =", mealId, "by user", userId);

    try {
      assert(
        typeof req.body.isActive === "number",
        "isActive must be a number"
      );
      assert(typeof req.body.isVega === "number", "isVega must be a number");
      assert(
        typeof req.body.isVegan === "number",
        "Description must be a number"
      );
      assert(
        typeof req.body.isToTakeHome === "number",
        "isToTakeHome must be a number"
      );
      assert(
        typeof req.body.maxAmountOfParticipants === "number",
        "maxAmountOfParticipants must be a number"
      );
      assert(typeof req.body.price === "string", "Price must be a string");
      assert(
        typeof req.body.imageUrl === "string",
        "imageUrl must be a string"
      );
      assert(typeof req.body.name === "string", "name must be a string");
      assert(
        typeof req.body.description === "string",
        "Description must be a string"
      );
      assert(
        typeof req.body.allergenes === "string",
        "Allergenes must be a string"
      );
    } catch (err) {
      logger.warn(err.message.toString());
      // If any of the assertions fail, send an error response.
      next({
        status: 400,
        message: "Invalid input for one or more fields",
        data: {},
      });

      return;
    }

    let sqlStatement =
      "UPDATE `meal` SET `isActive`=?, `isVega`=?, `isVegan`=?, `isToTakeHome`=?, `maxAmountOfParticipants`=?, `price`=?, `imageUrl`=?, `name`=?, `description`=?, `allergenes`=? WHERE `id`=? AND `cookId`=?";

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        // Check if the meal exists
        const checkMealSql = "SELECT * FROM `meal` WHERE `id` = ?";
        conn.query(checkMealSql, [mealId], (err, mealResults) => {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (mealResults && mealResults.length === 0) {
            logger.info("Meal not found with id: " + mealId);
            res.status(404).json({
              status: 404,
              message: "Meal not found",
              data: [],
            });
          } else {
            // Meal exists, check if the user is authorized to update it
            conn.query(
              sqlStatement,
              [
                req.body.isActive,
                req.body.isVega,
                req.body.isVegan,
                req.body.isToTakeHome,
                req.body.maxAmountOfParticipants,
                req.body.price,
                req.body.imageUrl,
                req.body.name,
                req.body.description,
                req.body.allergenes,
                mealId,
                userId,
              ],
              (err, results, fields) => {
                if (err) {
                  logger.error(err.message);
                  next({
                    status: 409,
                    message: err.message,
                  });
                }
                if (results && results.affectedRows > 0) {
                  logger.trace(results);
                  logger.info("Found", results.length, "results");
                  res.status(201).json({
                    status: 201,
                    message: "Meal updated",
                    data: {
                      meal: {
                        mealId,
                        isActive: req.body.isActive,
                        isVega: req.body.isVega,
                        isVegan: req.body.isVegan,
                        isToTakeHome: req.body.isToTakeHome,
                        maxAmountOfParticipants:
                          req.body.maxAmountOfParticipants,
                        price: req.body.price,
                        imageUrl: req.body.imageUrl,
                        name: req.body.name,
                        description: req.body.description,
                        allergenes: req.body.allergenes,
                      },
                    },
                  });
                } else {
                  logger.info("Not authorized");
                  res.status(403).json({
                    status: 403,
                    message: "Not authorized",
                    data: results,
                  });
                }
              }
            );
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 303 opvragen van alle maaltijden
  getAllMeals: (req, res, next) => {
    logger.info("Get all meals");

    let sqlStatement = "SELECT * FROM `meal`";
    // Hier wil je misschien iets doen met mogelijke filterwaarden waarop je zoekt.
    logger.info("sqlStatement", sqlStatement);
    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        conn.query(sqlStatement, function (err, results, fields) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (results) {
            logger.info("Found", results.length, "results");
            res.status(200).json({
              status: 200,
              message: "Meals retrieved",
              data: {
                meals: results.map((meal) => ({
                  mealId: meal.id,
                  isActive: meal.isActive,
                  isVega: meal.isVega,
                  isVegan: meal.isVegan,
                  isToTakeHome: meal.isToTakeHome,
                  maxAmountOfParticipants: meal.maxAmountOfParticipants,
                  price: meal.price,
                  imageUrl: meal.imageUrl,
                  name: meal.name,
                  description: meal.description,
                  allergenes: meal.allergenes,
                })),
              },
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 304 opvragen van een maaltijd bij id
  getMealById: (req, res, next) => {
    logger.info("Get meal by id");
    const mealId = req.params.mealId;
    logger.trace("Meal id =", mealId);
    let sqlStatement = "SELECT * FROM `meal` WHERE `id`=?";
    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        conn.query(sqlStatement, [mealId], function (err, results, fields) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (results && results.length > 0) {
            logger.info("Found", results.length, "results");
            res.status(200).json({
              status: 200,
              message: "Meal retrieved",
              data: results,
            });
          } else {
            logger.info("Meal not found with id:", mealId);
            res.status(404).json({
              status: 404,
              message: "Meal not found",
              data: [],
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 305 verwijderen van een maaltijd bij id
  deleteMeal: (req, res, next) => {
    const mealId = req.params.mealId;
    const userId = req.userId;

    logger.trace("Deleting meal id", mealId, "by user", userId);
    let sqlStatement = "DELETE FROM `meal` WHERE id=? AND cookId=? ";

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        // Check if the meal exists
        const checkMealSql = "SELECT * FROM `meal` WHERE `id` = ?";
        conn.query(checkMealSql, [mealId], function (err, mealResults) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (mealResults && mealResults.length === 0) {
            logger.info("Meal not found with id:", mealId);
            res.status(404).json({
              status: 404,
              message: "Meal not found",
              data: {},
            });
          } else if (mealResults[0].cookId !== userId) {
            logger.info("You are not the owner of this data!");
            res.status(403).json({
              status: 403,
              message: "You are not the owner of this data!",
              data: {},
            });
          } else {
            conn.query(
              sqlStatement,
              [mealId, userId],
              function (err, results, fields) {
                if (err) {
                  logger.error(err.message);
                  next({
                    status: 409,
                    message: err.message,
                  });
                }
                if (results && results.affectedRows === 1) {
                  logger.trace("results:", results);
                  res.status(200).json({
                    status: 200,
                    message: "Meal deleted",
                    data: {},
                  });
                } else {
                  next({
                    status: 401,
                    message: "Not authorized",
                    data: {},
                  });
                }
              }
            );
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 401 aanmelden voor maaltijd
  signUpForMeal: (req, res, next) => {
    const mealId = req.params.mealId;
    const userId = req.userId;
    logger.trace("Signing up for meal id", mealId, "by user", userId);
    let sqlStatement =
      "INSERT INTO `meal_participants_user` (mealId, userId) VALUES (?, ?)";
    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        // Check if the meal exists
        const checkMealSql = "SELECT * FROM `meal` WHERE `id` = ?";
        conn.query(checkMealSql, [mealId], function (err, mealResults) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (mealResults && mealResults.length === 0) {
            logger.info("Meal not found with id:", mealId);
            res.status(404).json({
              status: 404,
              message: "Meal not found",
              data: {},
            });
          } else {
            // Check if the user already signed up for the meal
            const checkSignupSql =
              "SELECT * FROM `meal_participants_user` WHERE `mealId` = ? AND `userId` = ?";
            conn.query(
              checkSignupSql,
              [mealId, userId],
              function (err, signupResults) {
                if (err) {
                  logger.error(err.message);
                  next({
                    status: 409,
                    message: err.message,
                  });
                }
                if (signupResults && signupResults.length > 0) {
                  logger.info("User already signed up for this meal");
                  res.status(409).json({
                    status: 409,
                    message: "You have already signed up for this meal",
                    data: {},
                  });
                } else {
                  // Count participants for the meal
                  const countParticipantsSql =
                    "SELECT COUNT(*) AS participantCount FROM `meal_participants_user` WHERE `mealId` = ?";
                  conn.query(
                    countParticipantsSql,
                    [mealId],
                    function (err, countResults) {
                      if (err) {
                        logger.error(err.message);
                        next({
                          status: 409,
                          message: err.message,
                        });
                      }
                      const participantCount = countResults[0].participantCount;
                      const maxParticipants =
                        mealResults[0].maxAmountOfParticipants;

                      if (participantCount >= maxParticipants) {
                        logger.info("Meal is already full with participants");
                        res.status(200).json({
                          status: 200,
                          message: "Maximum aantal aanmeldingen bereikt",
                          data: {},
                        });
                      } else {
                        conn.query(
                          sqlStatement,
                          [mealId, userId],
                          function (err, results, fields) {
                            if (err) {
                              logger.error(err.message);
                              next({
                                status: 409,
                                message: err.message,
                              });
                            }
                            if (results && results.affectedRows === 1) {
                              logger.trace("results:", results);
                              res.status(200).json({
                                status: 200,
                                message: `User met ID ${userId} is aangemeld voor maaltijd met ID ${mealId}`,
                                data: {},
                              });
                            } else {
                              next({
                                status: 401,
                                message: "Not authorized",
                                data: {},
                              });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        });
        conn.release();
      }
    });
  },

  // uc 402 afmelden voor maaltijd
  signOffForMeal: (req, res, next) => {
    const mealId = req.params.mealId;
    const userId = req.userId;
    logger.trace("Signing off for meal id", mealId, "by user", userId);
    let sqlStatement =
      "DELETE FROM `meal_participants_user` WHERE mealId=? AND userId=? ";
    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        // Check if the meal exists
        const checkMealSql = "SELECT * FROM `meal` WHERE `id` = ?";
        conn.query(checkMealSql, [mealId], function (err, mealResults) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (mealResults && mealResults.length === 0) {
            logger.info("Meal not found with id:", mealId);
            res.status(404).json({
              status: 404,
              message: "Meal not found",
              data: {},
            });
          } else {
            // Check if the user already signed up for the meal
            const checkSignupSql =
              "SELECT * FROM `meal_participants_user` WHERE `mealId` = ? AND `userId` = ?";
            conn.query(
              checkSignupSql,
              [mealId, userId],
              function (err, signupResults) {
                if (err) {
                  logger.error(err.message);
                  next({
                    status: 409,
                    message: err.message,
                  });
                }
                if (signupResults && signupResults.length === 0) {
                  logger.info("Aanmelding niet gevonden");
                  res.status(404).json({
                    status: 404,
                    message: "Aanmelding niet gevonden",
                    data: {},
                  });
                } else {
                  conn.query(
                    sqlStatement,
                    [mealId, userId],
                    function (err, results, fields) {
                      if (err) {
                        logger.error(err.message);
                        next({
                          status: 409,
                          message: err.message,
                        });
                      }
                      if (results && results.affectedRows === 1) {
                        logger.trace("results:", results);
                        res.status(200).json({
                          status: 200,
                          message: `User met ID ${userId} is afgemeld voor maaltijd met ID ${mealId}`,
                          data: {},
                        });
                      } else {
                        next({
                          status: 401,
                          message: "Not authorized",
                          data: {},
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        });
        conn.release();
      }
    });
  },

  // uc 403 opvragen van alle deelnemers van een maaltijd
  getMealParticipants: (req, res, next) => {
    const mealId = req.params.mealId;
    logger.trace("Getting participants for meal id", mealId);
    let sqlStatement =
      "SELECT u.id, u.firstName, u.lastName, u.isActive, u.emailAdress, u.phoneNumber, u.roles, u.street, u.city FROM `meal_participants_user` mpu JOIN `user` u ON mpu.userId = u.id WHERE mpu.mealId = ?";

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        // Check if the meal exists
        const checkMealSql = "SELECT * FROM `meal` WHERE `id` = ?";
        conn.query(checkMealSql, [mealId], function (err, mealResults) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (mealResults && mealResults.length === 0) {
            logger.info("Meal not found with id:", mealId);
            res.status(404).json({
              status: 404,
              message: "Meal not found",
              data: {},
            });
          } else {
            conn.query(sqlStatement, [mealId], function (err, results, fields) {
              if (err) {
                logger.error(err.message);
                next({
                  status: 409,
                  message: err.message,
                });
              }
              if (results && results.length > 0) {
                logger.trace("results:", results);
                res.status(200).json({
                  status: 200,
                  message: `Participants for meal with ID ${mealId}`,
                  data: results,
                });
              } else {
                next({
                  status: 401,
                  message: "Not authorized",
                  data: {},
                });
              }
            });
          }
        });
        conn.release();
      }
    });
  },

  // uc 404 Opvragen van details van deelnemer aan maaltijd
  getMealParticipantById: (req, res, next) => {
    const userId = req.params.participantId;
    const mealId = req.params.mealId;
    logger.trace(
      "Getting participant with id",
      userId,
      "for meal with id",
      mealId
    );
    let sqlStatement =
      "SELECT u.id, u.firstName, u.lastName, u.isActive, u.emailAdress, u.phoneNumber, u.roles, u.street, u.city FROM `meal_participants_user` mpu JOIN `user` u ON mpu.userId = u.id WHERE mpu.mealId = ? AND u.id = ?";

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      }
      if (conn) {
        // Check if the meal exists
        const checkMealSql = "SELECT * FROM `meal` WHERE `id` = ?";
        conn.query(checkMealSql, [mealId], function (err, mealResults) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (mealResults && mealResults.length === 0) {
            logger.info("Meal not found with id:", mealId);
            res.status(404).json({
              status: 404,
              message: "Meal not found",
              data: {},
            });
          } else {
            conn.query(
              sqlStatement,
              [mealId, userId],
              function (err, results, fields) {
                if (err) {
                  logger.error(err.message);
                  next({
                    status: 409,
                    message: err.message,
                  });
                }
                if (results && results.length > 0) {
                  logger.trace("results:", results);
                  res.status(200).json({
                    status: 200,
                    message: `Participant with ID ${userId} for meal with ID ${mealId}`,
                    data: results[0],
                  });
                } else {
                  next({
                    status: 401,
                    message: "Not authorized",
                    data: {},
                  });
                }
              }
            );
          }
        });
        conn.release();
      }
    });
  },
};

module.exports = mealController;
