//
// Authentication controller
//
const assert = require("assert");
const jwt = require("jsonwebtoken");
const pool = require("../util/database.js");
const { logger, jwtSecretKey } = require("../util/utils");

module.exports = {
  /**
   * login
   * Retourneer een geldig token indien succesvol
   */
  login(req, res, next) {
    logger.info(req.body);

    pool.getConnection((err, connection) => {
      if (err) {
        logger.error("Error getting connection from pool");
        next({
          code: 500,
          message: err.code,
        });
      }
      if (connection) {
        logger.trace("Login called");
        const sqlStatement = "SELECT * FROM `user` WHERE `emailAdress`=? ";

        connection.query(
          sqlStatement,
          [req.body.emailAdress],
          function (err, results, fields) {
            if (err) {
              logger.error(err.message);
              next({
                code: 409,
                message: err.message,
              });
            }
            if (results) {
              logger.info("Found", results.length, "results");

              if (
                results.length === 1 &&
                results[0].password === req.body.password
              ) {
                const { password, id, ...userInfo } = results[0];

                const payload = {
                  userId: id,
                };

                logger.info("Payload aangemaakt", payload);

                //token genereren
                jwt.sign(
                  payload,
                  jwtSecretKey,
                  { expiresIn: "2d" },
                  (err, token) => {
                    logger.info("Token gegenereerd: ", token);
                    if (token) {
                      res.status(200).json({
                        code: 200,
                        message: "Login endpoint",
                        data: {
                          id,
                          ...userInfo,
                          token: token,
                        },
                      });
                    }
                    logger.info("Payload: ", payload);
                  }
                );
              } else if (results.length === 0) {
                //user niet gevonden
                next({
                  code: 404,
                  message: "User not found",
                  data: undefined,
                });
              } else {
                //user wel gevonden maar password matcht niet
                next({
                  code: 400,
                  message: "Not authorized",
                  data: undefined,
                });
              }
            }
          }
        );
        pool.releaseConnection(connection);
      }
    });
  },

  /*
   * Validatie functie voor /api/login,
   * valideert of de vereiste body aanwezig is.
   */
  validateLogin(req, res, next) {
    logger.info("validateLogin called");
    // Verify that we receive the expected input
    try {
      assert(
        typeof req.body.emailAdress === "string",
        "emailAdress must be a string."
      );
      assert(
        typeof req.body.password === "string",
        "password must be a string."
      );
      next();
    } catch (ex) {
      res.status(400).json({
        error: ex.toString(),
        datetime: new Date().toISOString(),
      });
    }
  },

  validateToken(req, res, next) {
    logger.info("validateToken called");
    // logger.trace(req.headers)
    // The headers should contain the authorization-field with value 'Bearer [token]'
    const authHeader = req.headers.authorization;
    logger.info("AuthHeader:", authHeader);
    if (!authHeader) {
      logger.info("No authHeader found!");
      next({
        code: 401,
        message: "Authorization header missing!",
        data: undefined,
      });
    } else {
      /**
       * We hebben de headers. Lees het token daaruit, valideer het token
       * en lees de payload daaruit. De userId uit de payload stop je in de req,
       * en ga naar de volgende endpoint.
       */

      const token = authHeader.substring(7, authHeader.length);
      const payload = jwt.decode(token); // Decode the payload

      if (!payload) {
        logger.info("Invalid token!");
        next({
          code: 401,
          message: "Invalid token!",
          data: undefined,
        });
      } else {
        // Store the userId in the request object
        req.userId = payload.userId;
        logger.info("Payload", payload, "decoded successfully!");
        next();
      }
    }
  },
};
