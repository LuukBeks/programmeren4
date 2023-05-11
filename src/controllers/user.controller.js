const database = require("../util/inmem-db");
const logger = require("../util/utils").logger;
const assert = require("assert");
const pool = require("../util/database");

const userController = {
   // uc 201
  createUser(req, res) {
    logger.info("Register user");

    let sqlStatement =
      "INSERT INTO `user` (firstname, lastname, email, password, phonenumber, active) VALUES (?, ?, ?, ?, ?, ?)";

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
        try {
          assert(
            typeof req.body.firstname === "string",
            "firstname must be a string"
          );
          assert(
            typeof req.body.lastname === "string",
            "lastname must be a string"
          );
          assert(typeof req.body.email === "string", "email must be a string");
          assert(
            typeof req.body.password === "string",
            "password must be a string"
          );
          assert(
            typeof req.body.phonenumber === "string",
            "phonenumber must be a string"
          );
          assert(
            typeof req.body.active === "boolean",
            "active must be a boolean"
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
        conn.query(
          sqlStatement,
          [
            req.body.firstname,
            req.body.lastname,
            req.body.email,
            req.body.password,
            req.body.phonenumber,
            req.body.active,
          ],
          function (err, results, fields) {
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
          }
        );
        pool.releaseConnection(conn);
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
    logger.info("Getting user profile");

    let sqlStatement = "SELECT * FROM `user` WHERE id = 1";
    logger.info("sqlStatement", sqlStatement);
    pool.getConnection(function (err, conn) {
      logger.info("trying to connect to database");
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code.toString(),
          data: {},
        });
      }
      if (conn) {
        logger.info("Connected to database");
        conn.query(sqlStatement, function (err, results, fields) {
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

  // uc 205 wijzigen van usergegevens
  updateUserProfile: (req, res, next) => {
    logger.info("Update user profile");

    const userId = req.params.id; // assuming you have the user ID in the request parameters
    const { firstname, lastname, email, password, phonenumber, active } =
      req.body;

    let sqlStatement =
      "UPDATE `user` SET firstname = ?, lastname = ?, email = ?, password = ?, phonenumber = ?, active = ? WHERE id = ?";

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code.toString(),
          data: {},
        });
        return; // stop execution if there's an error
      }

      try {
        assert(typeof firstname === "string", "firstname must be a string");
        assert(typeof lastname === "string", "lastname must be a string");
        assert(typeof email === "string", "email must be a string");
        assert(typeof password === "string", "password must be a string");
        assert(typeof phonenumber === "string", "phonenumber must be a string");
        assert(typeof active === "boolean", "active must be a boolean");
      } catch (err) {
        logger.warn(err.message.toString());

        res.status(400).json({
          statusCode: 400,
          message: err.message.toString(),
          data: {},
        });
        return; // stop execution if there's an error
      }

      conn.query(
        sqlStatement,
        [firstname, lastname, email, password, phonenumber, active, userId],
        function (err, results, fields) {
          if (err) {
            logger.error(err.message);
            next({
              code: 409,
              message: err.message.toString(),
              data: {},
            });
            return; // stop execution if there's an error
          }

          logger.info("Updated user profile for user", userId);
          res.status(200).json({
            statusCode: 200,
            message: "User profile updated",
            data: {},
          });

          conn.release(); // release the connection back to the pool
        }
      );
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
