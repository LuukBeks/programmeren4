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
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status.toString(),
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
  
          const phoneNumberRegex = /^06(\s|-)?\d{8}$/;
          assert(phoneNumberRegex.test(req.body.phoneNumber), "invalid phone");
  
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
  
          // Email validation using regex
          const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
          assert(
            emailRegex.test(req.body.emailAdress),
            "emailAdress is invalid"
          );
  
          // Password validation
          const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
          assert(
            passwordRegex.test(req.body.password),
            "password must be at least 8 characters, have a capital letter, and a number"
          );
        } catch (err) {
          const errorMessage = err.message.toString();
          logger.warn(errorMessage);
          console.log(errorMessage); // Logging the error message
          res.status(400).json({
            status: 400,
            message: errorMessage,
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
                status: 500,
                message: err.message.toString(),
                data: {},
              });
            } else {
              if (results.length > 0) {
                // Email already exists
                res.status(403).json({
                  status: 403,
                  message: "User already exists",
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
                        status: 500,
                        message: err.message.toString(),
                        data: {},
                      });
                    } else {
                      logger.info("Found", results.length, "results");
                      res.status(201).json({
                        status: 201,
                        message: "User successfully created",
                        data: {
                          id: results.insertId,
                          firstName: req.body.firstName,
                          lastName: req.body.lastName,
                          isActive: req.body.isActive,
                          emailAdress: req.body.emailAdress,
                          phoneNumber: req.body.phoneNumber,
                          roles: req.body.roles,
                          street: req.body.street,
                          city: req.body.city,
                        },
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
    let filters = [];

    // Check if isActive filter is provided
    if (req.query.isActive) {
      // Check if the user fills in true or false, make it 1 or 0
      if (req.query.isActive === "true") {
        req.query.isActive = 1;
      } else if (req.query.isActive === "false") {
        req.query.isActive = 0;
      }
      filters.push(`isActive = ${req.query.isActive}`);
    }

    // Check if roles filter is provided
    if (req.query.roles) {
      const roles = req.query.roles.split(",");
      const rolesFilter = roles
        .map((role) => `roles LIKE '%${role}%'`)
        .join(" OR ");
      filters.push(`(${rolesFilter})`);
    }

    // Append filters to the SQL statement if any
    if (filters.length > 0) {
      sqlStatement += ` WHERE ${filters.join(" AND ")}`;
    }

    logger.info("sqlStatement", sqlStatement);
    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status,
        });
      } else {
        conn.query(sqlStatement, function (err, results, fields) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          } else {
            logger.info("Found", results.length, "results");

            // Check if no filters other than isActive or roles are provided
            if (
              Object.keys(req.query).filter(
                (key) => key !== "isActive" && key !== "roles"
              ).length === 0
            ) {
              res.status(200).json({
                status: 200,
                message: "User getAll endpoint",
                data: results,
              });
            } else if (
              Object.keys(req.query).some(
                (key) => key !== "isActive" && key !== "roles"
              )
            ) {
              next({
                status: 400,
                message: "Invalid filter(s) used",
              });
            } else {
              res.status(200).json({
                status: 200,
                message: "User getAll endpoint",
                data: [],
              });
            }
          }
          conn.release();
        });
      }
    });
  },

  // uc 203 opvragen van gebruikersprofiel (ingelogde gebruiker)
  getUserProfile: (req, res, next) => {
    logger.trace("Get user profile for user", req.userId);

    let sqlStatement = "SELECT * FROM `user` WHERE id=?";

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
        conn.query(sqlStatement, [req.userId], (err, results, fields) => {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message,
            });
          }
          if (results) {
            logger.trace("Found", results.length, "results");
            res.status(200).json({
              status: 200,
              message: "Get User profile",
              data: results[0],
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // uc 204 opvragen van gebruikersprofiel bij id
  getUserProfileById: (req, res, next) => {
    logger.info("Get user profile by id");

    const id = parseInt(req.params.id);
    const loggedInUserId = parseInt(req.userId);

    let sqlStatement;
    let queryParams;

    // Check if the logged-in user is the owner of the profile
    if (id === loggedInUserId) {
      // Retrieve user data including password for the owner
      sqlStatement = "SELECT * FROM `user` WHERE id = ?";
      queryParams = [id];
    } else {
      // Retrieve user data excluding password for others
      sqlStatement =
        "SELECT id, firstName, lastName, isActive, emailAdress, phoneNumber, roles, street, city FROM `user` WHERE id = ?";
      queryParams = [id];
    }

    pool.getConnection(function (err, conn) {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        next({
          status: 500,
          message: err.status.toString(),
          data: {},
        });
      }
      if (conn) {
        conn.query(sqlStatement, queryParams, function (err, results, fields) {
          if (err) {
            logger.error(err.message);
            next({
              status: 409,
              message: err.message.toString(),
              data: {},
            });
          } else if (results.length === 0) {
            logger.info("User not found");
            res.status(404).json({
              status: 404,
              message: "User not found!",
              data: {},
            });
          } else {
            logger.info("Found", results.length, "results");

            // Check if the logged-in user is the owner and include the password in the response
            if (id === loggedInUserId) {
              res.status(200).json({
                status: 200,
                message: "User profile",
                data: results,
              });
            } else {
              // Exclude the password from the response
              const userProfile = results.map((user) => {
                const { password, ...userData } = user;
                return userData;
              });

              res.status(200).json({
                status: 200,
                message: "User profile",
                data: userProfile,
              });
            }
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  updateUserProfile: (req, res, next) => {
    const userId = parseInt(req.params.id);
    const loggedInUserId = req.userId;

    logger.info(`Updating user ${req.params.id}`);
    const sqlStatement =
      "UPDATE user SET firstName = ?, lastName = ?, isActive = ?, emailAdress = ?, password = ?, phoneNumber = ?, roles = ?, street = ?, city = ? WHERE id = ?";
    const userCheckStatement =
      "SELECT COUNT(*) AS count FROM user WHERE id = ?";

    pool.getConnection((err, conn) => {
      if (err) {
        logger.error(err.status, err.syscall, err.address, err.port);
        return next({
          status: 500,
          message: err.status.toString(),
          data: {},
        });
      }

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
          /^06(\s|-)?\d{8}$/.test(req.body.phoneNumber),
          "phonenumber must be a 10-digit number(06-12345678)"
        );
        assert(typeof req.body.street === "string", "street must be a string");
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
        return res.status(400).json({
          status: 400,
          message: err.message.toString(),
          data: {},
        });
      }

      conn.query(userCheckStatement, [userId], (err, userCheckResults) => {
        if (err) {
          logger.error(err.message);
          return next({
            status: 500,
            message: err.message.toString(),
            data: {},
          });
        }

        if (userCheckResults[0].count === 0) {
          return res.status(404).json({
            status: 404,
            message: "User not found",
            data: {},
          });
        }

        if (userId !== loggedInUserId) {
          return res.status(403).json({
            status: 403,
            message: "Forbidden: You are not the owner of the data!",
            data: {},
          });
        }

        if (req.body.emailAdress === req.emailAdress) {
          updateUser();
        } else {
          const emailCheckStatement =
            "SELECT COUNT(*) AS count FROM user WHERE emailAdress = ? AND id <> ?";
          conn.query(
            emailCheckStatement,
            [req.body.emailAdress, userId],
            (err, emailCheckResults) => {
              if (err) {
                logger.error(err.message);
                return next({
                  status: 500,
                  message: err.message.toString(),
                  data: {},
                });
              }

              if (emailCheckResults[0].count > 0) {
                return res.status(409).json({
                  status: 409,
                  message: "Email already exists",
                  data: {},
                });
              }

              updateUser();
            }
          );
        }
      });

      function updateUser() {
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
          (err, results, fields) => {
            if (err) {
              logger.error(err.message);
              return next({
                status: 409,
                message: err.message.toString(),
                data: {},
              });
            }

            logger.info("Found", results.affectedRows, "rows affected");
            res.status(200).json({
              status: 200,
              message: "User profile updated",
              data: {
                id: userId,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                isActive: req.body.isActive,
                emailAdress: req.body.emailAdress,
                password: req.body.password,
                phoneNumber: req.body.phoneNumber,
                roles: req.body.roles,
                street: req.body.street,
                city: req.body.city,
              },
            });
          }
        );
      }
      conn.release();
    });
  },

  // uc 206
  deleteUser: (req, res, next) => {
    const method = req.method;
    const userId = parseInt(req.params.id);
    const loggedInUserId = req.userId;

    logger.info(
      `Method ${method} is called with parameters ${JSON.stringify(req.params)}`
    );

    // Test case: Gebruiker is niet ingelogd
    if (!loggedInUserId) {
      res.status(401).json({
        status: 401,
        message: "Unauthorized: User is not logged in",
        data: {},
      });
      return;
    }

    pool.getConnection(function (err, conn) {
      if (err) {
        next("Error: " + err.message);
      } else {
        // Test case: Gebruiker bestaat niet
        conn.query(
          "SELECT COUNT(*) AS count FROM `user` WHERE `id` = ?",
          [userId],
          function (err, countResults) {
            if (err) {
              res.status(500).json({
                status: 500,
                message: err.sqlMessage,
                data: {},
              });
              return;
            }

            if (countResults[0].count === 0) {
              res.status(404).json({
                status: 404,
                message: "User not found",
                data: {},
              });
              return;
            }

            // Test case: De gebruiker is niet de eigenaar van de data
            if (userId !== loggedInUserId) {
              res.status(403).json({
                status: 403,
                message:
                  "Forbidden: You are not authorized to delete this user",
                data: {},
              });
              return;
            }

            // Verwijder de gebruiker
            conn.query(
              "DELETE FROM `user` WHERE `id` = ?",
              [userId],
              function (err, deleteResults) {
                if (err) {
                  res.status(500).json({
                    status: 500,
                    message: err.sqlMessage,
                    data: {},
                  });
                  return;
                }

                // Test case: Gebruiker succesvol verwijderd
                res.status(200).json({
                  status: 200,
                  message: "User deleted with id " + userId,
                  data: deleteResults,
                });
              }
            );
          }
        );
        conn.release();
      }
    });
  },
};

module.exports = userController;
