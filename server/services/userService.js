const bcrypt = require('bcryptjs');

let users = [];
let currentId = 2;

const initDemoUser = () => {
  const demoUser = {
    id: "1",
    username: "user",
    email: "user@gmail.com",
    password: bcrypt.hashSync("user", 12),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  users = [demoUser];
  currentId = 2;
};

const findUserByEmail = (email) => users.find((u) => u.email === email);
const findUserByUsername = (username) => users.find((u) => u.username === username);
const findUserById = (id) => users.find((u) => u.id === id);

const generateId = () => (currentId++).toString();

const createUser = async ({ username, email, password }) => {
  const hashed = await bcrypt.hash(password, 12);
  const user = {
    id: generateId(),
    username,
    email,
    password: hashed,
    createdAt: new Date(),
  };
  users.push(user);
  return user;
};

const updateUser = (id, { newEmail, newName }) => {
  const user = findUserById(id);
  if (!user) return null;
  if (newName) user.username = newName;
  if (newEmail) user.email = newEmail;
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
  _internal: { users },
};