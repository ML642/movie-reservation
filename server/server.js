const listEndpoints = require('express-list-routes');
const app = require('./app');
const { connectMongo, getMongoReadyStateLabel } = require('./config/mongo');
const userService = require('./services/userService');

const PORT = process.env.PORT || 5000;

connectMongo();
userService.initDemoUser();

app.listen(PORT, () => {
  console.log(listEndpoints(app));
  console.log(`Server listening on port ${PORT}`);
  console.log(`MongoDB startup state: ${getMongoReadyStateLabel()}`);
});
