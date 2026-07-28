const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { isMongoReady } = require('../config/mongo');

let users = [];
let currentId = 2;
let memoryUsersVersion = 0;
let syncedMemoryUsersVersion = -1;
let syncMemoryUsersPromise = null;
let mongoSyncListenersAttached = false;

const buildDemoUser = () => ({
  id: '1',
  username: 'user',
  email: 'user@gmail.com',
  password: bcrypt.hashSync('user', 12),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeUsername = (username) => String(username || '').trim();

const normalizeMongoUser = (user) => {
  if (!user) return null;
  const plainUser = user.toObject ? user.toObject() : user;

  return {
    id: plainUser.id || plainUser._id?.toString(),
    username: plainUser.username,
    email: plainUser.email,
    password: plainUser.password,
    createdAt: plainUser.createdAt,
    updatedAt: plainUser.updatedAt,
  };
};

const findMemoryUserByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return users.find((u) => normalizeEmail(u.email) === normalizedEmail) || null;
};

const findMemoryUserByUsername = (username) => {
  const normalizedUsername = normalizeUsername(username);
  return users.find((u) => normalizeUsername(u.username) === normalizedUsername) || null;
};

const findMemoryUserById = (id) => {
  const userId = String(id || '');
  return users.find((u) => u.id === userId) || null;
};

const markMemoryUsersChanged = () => {
  memoryUsersVersion += 1;
};

const upsertMemoryUser = (user, { markDirty = false } = {}) => {
  const normalizedUser = normalizeMongoUser(user);
  if (!normalizedUser) return null;

  const existingIndex = users.findIndex((u) => u.id === normalizedUser.id);
  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...normalizedUser };
  } else {
    users.push(normalizedUser);
  }

  if (markDirty) markMemoryUsersChanged();
  return normalizedUser;
};

const syncMemoryUsersToMongo = async () => {
  if (!isMongoReady() || syncedMemoryUsersVersion === memoryUsersVersion) return;
  if (syncMemoryUsersPromise) return syncMemoryUsersPromise;

  syncMemoryUsersPromise = (async () => {
    while (isMongoReady() && syncedMemoryUsersVersion !== memoryUsersVersion) {
      const versionToSync = memoryUsersVersion;
      const operations = users.map((user) => ({
        updateOne: {
          filter: { id: user.id },
          update: {
            $setOnInsert: {
              id: user.id,
              username: user.username,
              email: normalizeEmail(user.email),
              password: user.password,
              createdAt: user.createdAt,
            },
          },
          upsert: true,
        },
      }));

      try {
        if (operations.length > 0) {
          // A single unordered bulk write replaces one update request per user.
          // It runs only after a memory mutation or reconnect, never before a lookup.
          await User.bulkWrite(operations, { ordered: false });
        }
      } catch (error) {
        console.warn('Memory user sync to Mongo was incomplete.', {
          message: error.message,
        });
      }

      // Do not make every read retry a failed sync. A later mutation or Mongo
      // reconnect will schedule another best-effort pass.
      syncedMemoryUsersVersion = versionToSync;
    }
  })().finally(() => {
    syncMemoryUsersPromise = null;
  });

  return syncMemoryUsersPromise;
};

const initDemoUser = () => {
  const demoUser = buildDemoUser();
  users.splice(0, users.length, demoUser);
  currentId = 2;
  markMemoryUsersChanged();
  return syncMemoryUsersToMongo();
};

const attachMongoSyncListeners = () => {
  if (mongoSyncListenersAttached) return;
  mongoSyncListenersAttached = true;

  mongoose.connection.on('connected', () => {
    void syncMemoryUsersToMongo();
  });

  mongoose.connection.on('disconnected', () => {
    // A reconnect is a safe point to retry a best-effort migration if a write
    // failed while the connection was unstable.
    syncedMemoryUsersVersion = -1;
  });
};

attachMongoSyncListeners();

const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (isMongoReady()) {
    try {
      const user = normalizeMongoUser(await User.findOne({ email: normalizedEmail }).lean());
      if (user) {
        upsertMemoryUser(user);
        return user;
      }
    } catch (error) {
      console.warn('Falling back to memory user lookup after Mongo read failed.', error.message);
    }
  }

  return findMemoryUserByEmail(normalizedEmail);
};

const findUserByUsername = async (username) => {
  const normalizedUsername = normalizeUsername(username);

  if (isMongoReady()) {
    try {
      const user = normalizeMongoUser(await User.findOne({ username: normalizedUsername }).lean());
      if (user) {
        upsertMemoryUser(user);
        return user;
      }
    } catch (error) {
      console.warn('Falling back to memory user lookup after Mongo read failed.', error.message);
    }
  }

  return findMemoryUserByUsername(normalizedUsername);
};

const findUserById = async (id) => {
  const userId = String(id || '');

  if (isMongoReady()) {
    try {
      const user = normalizeMongoUser(await User.findOne({ id: userId }).lean());
      if (user) {
        upsertMemoryUser(user);
        return user;
      }
    } catch (error) {
      console.warn('Falling back to memory user lookup after Mongo read failed.', error.message);
    }
  }

  return findMemoryUserById(userId);
};

const generateId = () => (currentId++).toString();
const generateMongoId = () => new mongoose.Types.ObjectId().toString();

const createUser = async ({ username, email, password }) => {
  const hashed = await bcrypt.hash(password, 12);
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);
  const user = {
    id: isMongoReady() ? generateMongoId() : generateId(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashed,
    createdAt: new Date(),
  };

  if (isMongoReady()) {
    try {
      const created = normalizeMongoUser(await User.create(user));
      upsertMemoryUser(created);
      return created;
    } catch (error) {
      if (error?.code === 11000) {
        const duplicateError = new Error('User already exists');
        duplicateError.code = 'USER_EXISTS';
        throw duplicateError;
      }

      console.warn('Falling back to memory user create after Mongo write failed.', error.message);
    }
  }

  upsertMemoryUser(user, { markDirty: true });
  void syncMemoryUsersToMongo();
  return user;
};

const updateUser = async (id, { newEmail, newName }) => {
  const user = await findUserById(id);
  if (!user) return null;

  const updates = {};
  if (newName) updates.username = normalizeUsername(newName);
  if (newEmail) updates.email = normalizeEmail(newEmail);

  if (isMongoReady()) {
    // Writes may need to persist a user that was created while MongoDB was
    // unavailable. Reads deliberately do not wait for this migration.
    await syncMemoryUsersToMongo();
    try {
      const updated = normalizeMongoUser(
        await User.findOneAndUpdate({ id: user.id }, { $set: updates }, { new: true }).lean()
      );
      if (updated) {
        upsertMemoryUser(updated);
        return updated;
      }
    } catch (error) {
      if (error?.code === 11000) {
        const duplicateError = new Error('User already exists');
        duplicateError.code = 'USER_EXISTS';
        throw duplicateError;
      }

      console.warn('Falling back to memory user update after Mongo write failed.', error.message);
    }
  }

  if (newName) user.username = normalizeUsername(newName);
  if (newEmail) user.email = normalizeEmail(newEmail);
  upsertMemoryUser(user, { markDirty: true });
  void syncMemoryUsersToMongo();
  return user;
};

module.exports = {
  initDemoUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  updateUser,
  // export users for debugging/tests:
  _internal: { users, syncMemoryUsersToMongo },
};
