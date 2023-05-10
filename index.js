const express = require("express");
const logger = require("./src/util/utils").logger;
const userRoutes = require("./src/routes/user.routes");

const app = express();
const port = 3000;

// For access to application/json request body
app.use(express.json());

app.use("*", (req, res, next) => {
  const method = req.method;
  logger.trace(`Methode ${method} is aangeroepen`);
  next();
});

// Ieder nieuw item in db krijgt 'autoincrement' index.
// Je moet die wel zelf toevoegen!
let index = database.users.length;

// Algemene route, vangt alle http-methods en alle URLs af, print
// een message, en ga naar de next URL (indien die matcht)!
app.use("*", (req, res, next) => {
  const method = req.method;
  console.log(`Methode ${method} is aangeroepen`);
  next();
});

// Info endpoints
app.get("/api/info", (req, res) => {
  res.status(201).json({
    status: 201,
    message: "Server info-endpoint",
    data: {
      studentName: "Luuk",
      studentNumber: 1234567,
      description: "Welkom bij de server API van de share a meal.",
    },
  });
});

app.use("/api/user", userRoutes);

app.use("*", (req, res) => {
  logger.warn("invalid endpoint called", req.path);
  res.status(404).json({
    status: 404,
    message: "Endpoint not found",
    data: {},
  });
});

app.use((err, req, res, next) => {
  logger.error(err.code, err.message);
  res.status(err.code).json({
    statusCode: err.code,
    message: err.message,
    data: {},
  });
});

app.listen(port, () => {
  logger.info(`Share-a-meal server listening on port ${port}`);
});

module.exports = app;

// // UC-201 Registreren als nieuwe user
// app.post('/api/user', (req, res) => {
//   // De usergegevens zijn meegestuurd in de request body.
//   // In de komende lessen gaan we testen of dat werkelijk zo is.
//   const user = req.body;
//   logger.info(`New user request received: ${JSON.stringify(user)}`);

//   // Hier zie je hoe je binnenkomende user info kunt valideren.
//   try {
//     assert(typeof user.firstName === 'string', 'firstName must be a string');
//     assert(typeof user.emailAdress === 'string', 'emailAdress must be a string');
//     assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.emailAdress), 'emailAdress must be a valid email');
//     const emailExists = database.users.some(
//       (user) => user.emailAdress === req.body.emailAdress
//     );
//     assert(emailExists === false, 'emailAdress must be unique');
//     assert(typeof user.password === 'string', 'password must be a string');
//     assert(typeof user.phonenumber === 'string', 'phonenumber must be a string');
//     assert(typeof user.active === 'boolean', 'active must be a boolean');

//   } catch (err) {
//     // Als één van de asserts failt sturen we een error response.
//     logger.error(`Error validating user: ${err.message}`);
//     res.status(400).json({
//       status: 400,
//       message: err.message.toString(),
//       data: {}
//     });
//     // Nodejs is asynchroon. We willen niet dat de applicatie verder gaat
//     // wanneer er al een response is teruggestuurd.
//     return;
//   }

//   // Zorg dat de id van de nieuwe user toegevoegd wordt
//   // en hoog deze op voor de volgende insert.
//   user.id = index++;
//   // User toevoegen aan database
//   database['users'].push(user);
//   logger.info(`New user added to database: ${JSON.stringify(user)}`);

//   // Stuur het response terug
//   res.status(200).json({
//     status: 200,
//     message: `User met id ${user.id} is toegevoegd`,
//     // Wat je hier retourneert is een keuze; misschien wordt daar in het
//     // ontwerpdocument iets over gezegd.
//     data: user
//   });
// });

// // UC-202 Opvragen van overzicht van users
// app.get('/api/user', (req, res) => {
//   const statusCode = 200;
//   logger.info(`User getAll endpoint - statusCode: ${statusCode}`);
//   res.status(statusCode).json({
//     status: statusCode,
//     message: 'User getAll endpoint',
//     data: database.users
//   });
// });

// // UC-202 Opvragen van overzicht van users
// app.get('/api/user', (req, res) => {
//   const active = req.query.active;
//   const firstName = req.query.firstName;
//   let filteredUsers = database.users;

//   const allowedFilters = ['active', 'firstName'];
//   const invalidFilters = Object.keys(req.query).filter(key => !allowedFilters.includes(key));
//   if (invalidFilters.length) {
//       res.status(400).json({
//           status: 400,
//           message: 'No valid filter(s) found',
//           data: []
//       });
//       return;
//   }
//   if (firstName) {
//       const pattern = new RegExp(firstName, 'i');
//       filteredUsers = filteredUsers.filter(user => pattern.test(user.firstName));
//   }
//   if (active === 'true') {
//       filteredUsers = filteredUsers.filter(user => user.Active === true);
//   } else if (active === 'false') {
//       filteredUsers = filteredUsers.filter(user => user.Active === false);
//   }

//   // Return all users if no query has been used
//   if (!active && !firstName) {
//       res.status(200).json({
//           status: 200,
//           message: 'All users',
//           data: filteredUsers
//       });
//   } else if (Object.keys(req.query).some(key => key !== 'name' && key !== 'active')) {
//       // Return empty list if query other than name or active is used
//       res.status(200).json({
//           status: 200,
//           message: 'Invalid query',
//           data: []
//       });
//   } else {
//       // Filter users based on the provided query parameters
//       res.status(200).json({
//           status: 200,
//           message: 'Filtered users',
//           data: filteredUsers
//       });
//   }
// });

// // UC-203 Opvragen van gebruikersprofiel
// app.get('/api/user/profile', (req, res) => {
//   const testProfile = {
//     firstName: 'Luuk',
//     lastName: 'Bosch',
//     emailAdress: 'Lb@gmail.com',
//     phonenumber: '0612345678',
//     active: true,
//   }

//   const statusCode = 200;
//   res.status(statusCode).json({
//     status: statusCode,
//     message: 'User profile endpoint',
//     data: testProfile
//   });
// });

// // UC-204 Opvragen van usergegevens bij ID
// app.get('/api/user/:userId', (req, res) => {
//   // er moet precies 1 response verstuurd worden.
//   const userId = req.params.userId;
//   const user = database.users.find(user => user.id.toString() === userId);

//   if (!user) {
//     logger.error(`No user found for userId '${userId}'`);
//     // If no user found for given userId, return 404 Not Found error
//     return res.status(404).json({
//       status: 404,
//       message: `No user found for userId '${userId}'`,
//       data: null
//     });
//   }

//   res.status(200).json({
//     status: 200,
//     message: 'User getById endpoint',
//     data: user
//   });
// });

// // UC-205 Wijzigen van usergegevens
// app.put('/api/user/:userId', (req, res) => {
//   const userId = req.params.userId;
//   const userData = req.body;
//   const userIndex = database.users.findIndex(user => user.id.toString() === userId);

//   if (userIndex === -1) {
//     // If no user found for given userId, return 404 Not Found error
//     return res.status(404).json({
//       status: 404,
//       message: `No user found for userId '${userId}'`,
//       data: null
//     });
//   }

//   // Update user data in the database
//   database.users[userIndex] = {
//     ...database.users[userIndex],
//     ...userData
//   };

//   res.status(200).json({
//     status: 200,
//     message: `User with userId '${userId}' updated successfully`,
//     data: database.users[userIndex]
//   });
// });

// // UC-206 Verwijderen van user
// app.delete('/api/user/:userId', (req, res) => {
//   const userId = req.params.userId;
//   const userIndex = database.users.findIndex(user => user.id.toString() === userId);
//   console.log("id: " + userId);
//   console.log("userIndex: "+userIndex);

//   if (userIndex === -1) {
//     // If no user found for given userId, return 404 Not Found error
//     logger.error(`No user found for userId '${userId}'`);
//     return res.status(404).json({
//       status: 404,
//       message: `No user found for userId '${userId}'`,
//       data: null
//     });
//   }

//   // Remove user from the database
//   database.users.splice(userIndex, 1);
//   logger.info('User deleted successfully');
//   res.status(200).json({
//     status: 200,
//     message: 'User deleted successfully',
//     data: null
//   });
// });

// // Wanneer geen enkele endpoint matcht kom je hier terecht. Dit is dus
// // een soort 'afvoerputje' (sink) voor niet-bestaande URLs in de server.
// app.use('*', (req, res) => {
//   res.status(404).json({
//     status: 404,
//     message: 'Endpoint not found',
//     data: {}
//   });
// });

// // Start de server
// app.listen(port, () => {
//   logger.info(`Example app listening on port ${port}`);
//   console.log(`Example app listening on port ${port}`);
// });

// // Export de server zodat die in de tests beschikbaar is.
// module.exports = app;
