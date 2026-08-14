const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

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

const findUserByEmail = async (email) =>
  normalizeMongoUser(await User.findOne({ email: normalizeEmail(email) }).lean());

const findUserByUsername = async (username) =>
  normalizeMongoUser(await User.findOne({ username: normalizeUsername(username) }).lean());

const findUserById = async (id) =>
  normalizeMongoUser(await User.findOne({ id: String(id || '') }).lean());

const createUser = async ({ username, email, password }) => {
  try {
    return normalizeMongoUser(
      await User.create({
        id: new mongoose.Types.ObjectId().toString(),
        username: normalizeUsername(username),
        email: normalizeEmail(email),
        password: await bcrypt.hash(password, 12),
      })
    );
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateError = new Error('User already exists');
      duplicateError.code = 'USER_EXISTS';
      throw duplicateError;
    }
    throw error;
  }
};

const updateUser = async (id, { newEmail, newName }) => {
  const updates = {};
  if (newName) updates.username = normalizeUsername(newName);
  if (newEmail) updates.email = normalizeEmail(newEmail);

  try {
    return normalizeMongoUser(
      await User.findOneAndUpdate({ id: String(id || '') }, { $set: updates }, { new: true }).lean()
    );
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateError = new Error('User already exists');
      duplicateError.code = 'USER_EXISTS';
      throw duplicateError;
    }
    throw error;
  }
};

module.exports = {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  updateUser,
};
