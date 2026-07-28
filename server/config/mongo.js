const mongoose = require('mongoose');
const dns = require('node:dns').promises;

let listenersAttached = false;
let connectPromise = null;

const URI_ENV_NAMES = ['MONGODB_URI', 'MONGO_URI', 'MONGO_DB', 'MoNGO_DB'];
const PASSWORD_ENV_NAMES = ['MONGO_DB_PASSWORD', 'MONGO_DB_PASSWD', 'MONGODB_PASSWORD'];
const FALLBACK_DNS_SERVERS = ['1.1.1.1', '8.8.8.8'];

const getFirstEnvValue = (names) => {
  const name = names.find((envName) => process.env[envName]);
  return {
    name,
    value: name ? process.env[name] : '',
  };
};

const getMongoReadyStateLabel = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] || 'unknown';
};

const sanitizeMongoError = (error) => ({
  name: error?.name || 'MongoError',
  message: error?.message || 'Unknown MongoDB error',
  code: error?.code,
});

const explainMongoError = (error) => {
  const message = error?.message || '';

  if (error?.code === 'ECONNREFUSED' && /querySrv/i.test(message)) {
    return 'DNS SRV lookup was refused. Check local DNS/VPN/firewall, try another DNS resolver, or use a non-SRV mongodb:// connection string.';
  }

  if (error?.code === 'ENOTFOUND' || error?.code === 'ENODATA') {
    return 'MongoDB host was not found. Check the Atlas cluster hostname and connection string.';
  }

  if (error?.code === 'ETIMEOUT' || /timed out/i.test(message)) {
    return 'MongoDB connection timed out. Check network access, firewall, VPN, and Atlas IP access list.';
  }

  if (/authentication failed/i.test(message)) {
    return 'MongoDB authentication failed. Check database username and password.';
  }

  return 'MongoDB connection failed. Check URI, credentials, network access, and Atlas IP access list.';
};

const getMongoSrvHostname = (uri) => {
  if (!/^mongodb\+srv:\/\//i.test(uri)) {
    return null;
  }

  try {
    return new URL(uri).hostname;
  } catch {
    return null;
  }
};

const runMongoDnsPreflight = async (uri) => {
  const hostname = getMongoSrvHostname(uri);

  if (!hostname) {
    return true;
  }

  const srvRecordName = `_mongodb._tcp.${hostname}`;

  try {
    const records = await dns.resolveSrv(srvRecordName);
    console.log(`MongoDB DNS preflight: resolved ${records.length} SRV record(s) for ${hostname}.`);
    return true;
  } catch (error) {
    if (error?.code !== 'ECONNREFUSED') {
      console.warn('MongoDB DNS preflight failed.', {
        host: hostname,
        record: srvRecordName,
        ...sanitizeMongoError(error),
        hint: explainMongoError(error),
      });
      return false;
    }

    const originalServers = dns.getServers();
    console.log(
      `MongoDB DNS preflight: system DNS refused SRV lookup for ${hostname}; retrying with ${FALLBACK_DNS_SERVERS.join(', ')}.`
    );

    try {
      dns.setServers(FALLBACK_DNS_SERVERS);
      const retryRecords = await dns.resolveSrv(srvRecordName);
      console.log(
        `MongoDB DNS preflight: fallback DNS resolved ${retryRecords.length} SRV record(s) for ${hostname}.`
      );
      return true;
    } catch (retryError) {
      console.warn('MongoDB DNS preflight fallback failed.', {
        host: hostname,
        record: srvRecordName,
        ...sanitizeMongoError(retryError),
        hint: explainMongoError(retryError),
      });
      dns.setServers(originalServers);
      return false;
    }
  }
};

const buildMongoUri = () => {
  const uriConfig = getFirstEnvValue(URI_ENV_NAMES);
  const passwordConfig = getFirstEnvValue(PASSWORD_ENV_NAMES);
  const rawUri = uriConfig.value || '';
  const password = passwordConfig.value || '';
  const uriHasPasswordPlaceholder = /<db_password>|<password>/i.test(rawUri);

  if (!rawUri) {
    console.warn('MongoDB config: no URI env var found. Expected one of:', URI_ENV_NAMES.join(', '));
    return { uri: '', canConnect: false };
  }

  console.log(
    `MongoDB config: URI loaded from ${uriConfig.name}; password env ${
      passwordConfig.name ? `loaded from ${passwordConfig.name}` : 'not provided'
    }.`
  );

  if (uriHasPasswordPlaceholder && !password) {
    console.warn(
      'MongoDB config mistake: URI still needs a password, but no Mongo password env var was found. Using in-memory fallback.'
    );
    return { uri: '', canConnect: false };
  }

  const uri = password
    ? rawUri
        .replace(/<db_password>/g, encodeURIComponent(password))
        .replace(/<password>/g, encodeURIComponent(password))
    : rawUri;

  if (/<db_password>|<password>/i.test(uri)) {
    console.warn('MongoDB config mistake: URI still contains an unresolved password placeholder. Using in-memory fallback.');
    return { uri: '', canConnect: false };
  }

  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    console.warn('MongoDB config mistake: URI must start with mongodb:// or mongodb+srv://. Using in-memory fallback.');
    return { uri: '', canConnect: false };
  }

  return { uri, canConnect: true };
};

const attachMongoLogs = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log(`MongoDB status: connected to database "${mongoose.connection.name || 'unknown'}".`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB status: disconnected. Likes will use fallback until Mongo reconnects.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB status: reconnected.');
  });

  mongoose.connection.on('error', (error) => {
    console.warn('MongoDB status: connection error.', sanitizeMongoError(error));
  });
};

const connectMongo = () => {
  attachMongoLogs();

  if (isMongoReady()) {
    return Promise.resolve(mongoose.connection);
  }

  if (connectPromise) {
    return connectPromise;
  }

  const { uri, canConnect } = buildMongoUri();

  if (!canConnect) {
    console.warn(`MongoDB startup: skipped. Current state is ${getMongoReadyStateLabel()}.`);
    return Promise.resolve(null);
  }

  connectPromise = (async () => {
    console.log(`MongoDB startup: connecting. Current state is ${getMongoReadyStateLabel()}.`);

    const dnsReady = await runMongoDnsPreflight(uri);
    if (!dnsReady) {
      console.warn('MongoDB startup: skipped because DNS preflight failed. Using in-memory fallback.');
      return null;
    }

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB startup: ready. Current state is ${getMongoReadyStateLabel()}.`);
      return mongoose.connection;
    } catch (error) {
      console.warn(
        'MongoDB startup: connection failed. Using in-memory fallback.',
        {
          ...sanitizeMongoError(error),
          hint: explainMongoError(error),
        }
      );
      return null;
    }
  })().finally(() => {
    connectPromise = null;
  });

  return connectPromise;
};

const isMongoReady = () => mongoose.connection.readyState === 1;

module.exports = {
  connectMongo,
  getMongoReadyStateLabel,
  isMongoReady,
};
