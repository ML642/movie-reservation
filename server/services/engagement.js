require('dotenv').config();
const { createEngagementModule } = require('../build/Engagement/compositionRoot');
const tokenVerifier = require('./jwtVerifier');
const { createServiceApp, database, start } = require('./common');

const app = createServiceApp();
const routes = createEngagementModule(tokenVerifier, database);
app.use('/api/likes', routes.likedMoviesRoutes);
app.use('/api/comments', routes.commentsRoutes);

if (require.main === module) start(app, process.env.PORT || 5002);
module.exports = app;
