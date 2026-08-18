import type { NewUserInput, ProfileChanges, User } from '../../domain/users_interfaces';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByOAuthIdentity(provider: 'google' | 'github', subject: string): Promise<User | null>;
  create(user: NewUserInput): Promise<User>;
  updateById(id: string, changes: ProfileChanges): Promise<User | null>;
  getRefreshTokenHash(userId: string): Promise<string | null>;
  replaceRefreshTokenHash(userId: string, previousHash: string | null, nextHash: string): Promise<boolean>;
}
