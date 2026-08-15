import { IdentityError } from './IdentityError';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NewUserInput {
  username: string;
  email: string;
  password: string;
}

export interface ProfileChanges {
  username?: string;
  email?: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
}

export interface UserProfile extends PublicUser {
  createdAt?: Date;
}

export const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();
export const normalizeUsername = (username: string) => String(username || '').trim();

export const createNewUserInput = (input: NewUserInput): NewUserInput => {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);

  if (!username || !email || !input.password) {
    throw new IdentityError('MISSING_REQUIRED_FIELDS', 'Missing required fields');
  }

  return { username, email, password: input.password };
};

export const createProfileChanges = (input: { newName?: string; newEmail?: string }): ProfileChanges => {
  const changes: ProfileChanges = {};
  if (input.newName) changes.username = normalizeUsername(input.newName);
  if (input.newEmail) changes.email = normalizeEmail(input.newEmail);

  if (Object.keys(changes).length === 0) {
    throw new IdentityError('NO_PROFILE_CHANGES', 'Nothing to update');
  }

  return changes;
};

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
});

export const toUserProfile = (user: User): UserProfile => ({
  ...toPublicUser(user),
  createdAt: user.createdAt,
});
