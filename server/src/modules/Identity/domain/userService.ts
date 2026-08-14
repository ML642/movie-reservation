const bcrypt = require('bcryptjs');
const User = require('../../../../models/User');
const { isMongoReady_ } = require('../../../../config/mongo');

const createStorageError = () => Object.assign(new Error('User storage is temporarily unavailable.'), {
  code: 'STORAGE_UNAVAILABLE',
});

const ensureMongoReady = () => {
  if (!isMongoReady_()) throw createStorageError();
};

const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();
const normalizeUsername = (username: string) => String(username || '').trim();

const normalizeMongoUser = (user: any) => {
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

const findUserByEmail = async (email: string) => {
  ensureMongoReady();
  return normalizeMongoUser(await User.findOne({ email: normalizeEmail(email) }).lean());
};

const findUserByUsername = async (username: string) => {
  ensureMongoReady();
  return normalizeMongoUser(await User.findOne({ username: normalizeUsername(username) }).lean());
};

const findUserById = async (id: string) => {
  ensureMongoReady();
  return normalizeMongoUser(await User.findOne({ id: String(id || '') }).lean());
};

const createUser = async ({ username, email, password }: { username: string; email: string; password: string }) => {
  try {
    ensureMongoReady();
    return normalizeMongoUser(
      await User.create({
        id: new mongoose.Types.ObjectId().toString(),
        username: normalizeUsername(username),
        email: normalizeEmail(email),
        password: await bcrypt.hash(password, 12),
      })
    );
  } catch (error: any) {
    if (error?.code === 11000) {
      const duplicateError: any = new Error('User already exists');
      duplicateError.code = 'USER_EXISTS';
      throw duplicateError;
    }
    throw error;
  }
};

const updateUser = async (id: string, { newEmail, newName }: { newEmail?: string; newName?: string }) => {
  const updates: Record<string, string> = {};
  if (newName) updates.username = normalizeUsername(newName);
  if (newEmail) updates.email = normalizeEmail(newEmail);

  try {
    ensureMongoReady();
    return normalizeMongoUser(
      await User.findOneAndUpdate({ id: String(id || '') }, { $set: updates }, { new: true }).lean()
    );
  } catch (error: any) {
    if (error?.code === 11000) {
      const duplicateError: any = new Error('User already exists');
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
