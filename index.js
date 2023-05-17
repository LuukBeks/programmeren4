const express = require("express");
const logger = require("./src/util/utils").logger;
const userRoutes = require("./src/routes/user.routes.js");
const mealRoutes = require("./src/routes/meal.routes.js");
const authRoutes = require("./src/routes/auth.routes.js");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("*", (req, res, next) => {
  const method = req.method;
  logger.trace(`Methode ${method} is aangeroepen`);
  next();
});

app.get('/api/info', (req, res) => {
  logger.info('Get server information');
  res.status(201).json({
    status: 201,
    message: 'Server info-endpoint',
    data: {
      studentName: 'Luuk Beks',
      studentNumber: 2202133,
      description: 'Share a meal API'
    }
  });
});

app.use('/api/user', userRoutes);
app.use('/api', authRoutes);

app.use('*', (req, res) => {
  logger.warn('Invalid endpoint called: ', req.path);
  res.status(404).json({
    status: 404,
    message: 'Endpoint not found',
    data: {}
  });
});

app.use((err, req, res, next) => {
  logger.error(err.code, err.message);
  res.status(err.code).json({
    statusCode: err.code,
    message: err.message,
    data: {}
  });
});

// Start de server
app.listen(port, () => {
  logger.info(`Share-a-Meal server listening on port ${port}`);
});

// Export de server zodat die in de tests beschikbaar is.
module.exports = app;