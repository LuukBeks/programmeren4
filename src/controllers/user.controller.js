const database = require("../util/inmem-db");
const logger = require("../util/utils").logger;
const assert = require("assert");
const pool = require("../util/database");

const userController = {
  createUser(req, res, next) {
    logger.info("Register user");
    let sqlStatement =
      "INSERT INTO user (firstName, lastName, isActive, emailAdress, password, phoneNumber, roles, street, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code.toString(),
          data: {},
        });
      } else {
        try {
          assert(
            typeof req.body.firstName === "string",
            "firstname must be a string"
          );
          assert(
            typeof req.body.lastName === "string",
            "lastname must be a string"
          );
          assert(
            typeof req.body.emailAdress === "string",
            "email must be a string"
          );
          assert(
            typeof req.body.password === "string",
            "password must be a string"
          );
          assert(
            typeof req.body.phoneNumber === "string",
            "phonenumber must be a string"
          );
          assert(
            typeof req.body.street === "string",
            "street must be a string"
          );
          assert(typeof req.body.city === "string", "city must be a string");
          assert(
            typeof req.body.roles === "string",
            "roles must be an admin, editor, or guest; choose one or multiple"
          );
          assert(
            Number.isInteger(req.body.isActive),
            "isActive must be an integer, 1 or 0"
          );
        } catch (err) {
          logger.warn(err.message.toString());
          res.status(400).json({
            statusCode: 400,
            message: err.message.toString(),
            data: {},
          });
          return;
        }

        // Check if email already exists
        conn.query(
          "SELECT emailAdress FROM user WHERE emailAdress = ?",
          [req.body.emailAdress],
          function (err, results, fields) {
            if (err) {
              logger.error(err.message);
              next({
                code: 500,
                message: err.message.toString(),
                data: {},
              });
            } else {
              if (results.length > 0) {
                // Email already exists
                res.status(409).json({
                  statusCode: 409,
                  message: "Email address already exists",
                  data: {},
                });
              } else {
                // Email does not exist, proceed with user creation
                conn.query(
                  sqlStatement,
                  [
                    req.body.firstName,
                    req.body.lastName,
                    req.body.isActive,
                    req.body.emailAdress,
                    req.body.password,
                    req.body.phoneNumber,
                    req.body.roles,
                    req.body.street,
                    req.body.city,
                  ],
                  function (err, results, fields) {
                    if (err) {
                      logger.error(err.message);
                      next({
                        code: 500,
                        message: err.message.toString(),
                        data: {},
                      });
                    } else {
                      logger.info("Found", results.length, "results");
                      res.status(201).json({
                        statusCode: 201,
                        message: "User successfully created",
                        data: results,
                      });
                    }
                  }
                );
              }
            }
            conn.release();
          }
        );
      }
    });
  },

  // uc 202
  getAllUsers: (req, res, next) => {
    logger.info("Get all users");

    let sqlStatement = "SELECT * FROM `user`";
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
              message: "User getAll endpoint",
              data: results,
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 203 opvragen van gebruikersprofiel (ingelogde gebruiker)
  getUserProfile: (req, res, next) => {
    logger.trace('Get user profile for user', req.userId);

    let sqlStatement = 'SELECT * FROM `user` WHERE id=?';

    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code
        });
      }
      if (conn) {
        conn.query(sqlStatement, [req.userId], (err, results, fields) => {
          if (err) {
            logger.error(err.message);
            next({
              code: 409,
              message: err.message
            });
          }
          if (results) {
            logger.trace('Found', results.length, 'results');
            res.status(200).json({
              code: 200,
              message: 'Get User profile',
              data: results[0]
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 204 opvragen van gebruikersprofiel bij id
  getUserProfileById: (req, res) => {
    logger.info("Get user profile by id");

    let sqlStatement = "SELECT * FROM `user` WHERE id = ?";

    const id = req.params.id;

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code.toString(),
          data: {},
        });
      }
      if (conn) {
        conn.query(sqlStatement, [id], function (err, results, fields) {
          if (err) {
            logger.error(err.message);
            next({
              code: 409,
              message: err.message.toString(),
              data: {},
            });
          }
          if (results) {
            logger.info("Found", results.length, "results");
            res.status(200).json({
              statusCode: 200,
              message: "User getAll endpoint",
              data: results,
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  updateUserProfile(req, res, next) {
    logger.info(`Updating user ${req.params.id}`);
    let sqlStatement =
      "UPDATE user SET firstName = ?, lastName = ?, isActive = ?, emailAdress = ?, password = ?, phoneNumber = ?, roles = ?, street = ?, city = ? WHERE id = ?";
    
    // Add the select statement to check if email already exists
    let emailCheckStatement = "SELECT COUNT(*) AS count FROM user WHERE emailAdress = ? AND id <> ?";
    
    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code.toString(),
          data: {},
        });
      } else {
        try {
          assert(
            typeof req.body.firstName === "string",
            "firstname must be a string"
          );
          assert(
            typeof req.body.lastName === "string",
            "lastname must be a string"
          );
          assert(
            typeof req.body.emailAdress === "string",
            "email must be a string"
          );
          assert(
            typeof req.body.password === "string",
            "password must be a string"
          );
          assert(
            typeof req.body.phoneNumber === "string",
            "phonenumber must be a string"
          );
          assert(
            typeof req.body.street === "string",
            "street must be a string"
          );
          assert(typeof req.body.city === "string", "city must be a string");
          assert(
            typeof req.body.roles === "string",
            "roles must be admin, editor, or guest; choose one or multiple"
          );
          assert(
            Number.isInteger(req.body.isActive),
            "isActive must be an integer, 1 or 0"
          );
        } catch (err) {
          logger.warn(err.message.toString());
          res.status(400).json({
            statusCode: 400,
            message: err.message.toString(),
            data: {},
          });
          return;
        }
        
        // Execute the email check query first
        conn.query(emailCheckStatement, [req.body.emailAdress, req.params.id], function (err, emailCheckResults) {
          if (err) {
            logger.error(err.message);
            next({
              code: 500,
              message: err.message.toString(),
              data: {},
            });
          } else {
            if (emailCheckResults[0].count > 0) {
              // Email already exists
              res.status(409).json({
                statusCode: 409,
                message: "Email already exists",
                data: {},
              });
            } else {
              // Email does not exist, proceed with the update query
              conn.query(
                sqlStatement,
                [
                  req.body.firstName,
                  req.body.lastName,
                  req.body.isActive,
                  req.body.emailAdress,
                  req.body.password,
                  req.body.phoneNumber,
                  req.body.roles,
                  req.body.street,
                  req.body.city,
                  req.params.id,
                ],
                function (err, results, fields) {
                  if (err) {
                    logger.error(err.message);
                    next({
                      code: 409,
                      message: err.message.toString(),
                      data: {},
                    });
                  } else {
                    logger.info("Found", results.affectedRows, "rows affected");
                    res.status(200).json({
                      statusCode: 200,
                      message: "User profile updated",
                      data: results,
                    });
                  }
                }
              );
            }
          }
        });
        conn.release();
      }
    });
  },

  // uc 206
  deleteUser: (req, res, next) => {
    logger.info("Delete user");

    const id = req.params.id;
    let sqlStatement = "DELETE FROM `user` WHERE id = ?";

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code.toString(),
          data: {},
        });
      }
      if (conn) {
        conn.query(sqlStatement, [id], function (err, results, fields) {
          if (err) {
            logger.error(err.message);
            next({
              code: 409,
              message: err.message.toString(),
              data: {},
            });
          }
          if (results.affectedRows === 0) {
            logger.info("No user found with id", id);
            next({
              code: 404,
              message: "User not found",
              data: {},
            });
          } else {
            logger.info("Deleted user with id", id);
            res.status(200).json({
              statusCode: 200,
              message: "User deleted successfully",
              data: {},
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },
};

module.exports = userController;
