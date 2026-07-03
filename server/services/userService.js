const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { isMongoReady } = require('../config/mongo');

let users = [];
let currentId = 2;

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

const upsertMemoryUser = (user) => {
  const normalizedUser = normalizeMongoUser(user);
  if (!normalizedUser) return null;

  const existingIndex = users.findIndex((u) => u.id === normalizedUser.id);
  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...normalizedUser };
  } else {
    users.push(normalizedUser);
  }

  return normalizedUser;
};

const syncMemoryUsersToMongo = async () => {
  if (!isMongoReady()) return;

  for (const user of users) {
    try {
      await User.updateOne(
        { id: user.id },
        {
          $setOnInsert: {
            id: user.id,
            username: user.username,
            email: normalizeEmail(user.email),
            password: user.password,
            createdAt: user.createdAt,
          },
        },
        { upsert: true }
      );
    } catch (error) {
      console.warn('Skipping memory user sync to Mongo.', {
        userId: user.id,
        message: error.message,
      });
    }
  }
};

const initDemoUser = () => {
  const demoUser = buildDemoUser();
  users = [demoUser];
  currentId = 2;
  return syncMemoryUsersToMongo();
};

const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (isMongoReady()) {
    await syncMemoryUsersToMongo();
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
    await syncMemoryUsersToMongo();
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
    await syncMemoryUsersToMongo();
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
    await syncMemoryUsersToMongo();
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

  users.push(user);
  return user;
};

const updateUser = async (id, { newEmail, newName }) => {
  const user = await findUserById(id);
  if (!user) return null;

  const updates = {};
  if (newName) updates.username = normalizeUsername(newName);
  if (newEmail) updates.email = normalizeEmail(newEmail);

  if (isMongoReady()) {
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
  upsertMemoryUser(user);
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
