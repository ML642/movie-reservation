require('dotenv').config();
const { createIdentityModule } = require('../build/Identity/compositionRoot');
const { createServiceApp, database, start } = require('./common');

const app = createServiceApp();
app.use('/api', createIdentityModule(database).authRoutes);

if (require.main === module) start(app, process.env.PORT || 5001);
module.exports = app;
