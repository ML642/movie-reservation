require('dotenv').config();
const { createReservationModule } = require('../build/Reservation/compositionRoot');
const tokenVerifier = require('./jwtVerifier');
const { createServiceApp, database, start } = require('./common');

const app = createServiceApp();
app.use('/api/reservation', createReservationModule(tokenVerifier, database));

if (require.main === module) start(app, process.env.PORT || 5003);
module.exports = app;
