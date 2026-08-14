import type { User } from '../../domain/user';

/**
 * Application-layer contract for user persistence.
 * Infrastructure will provide the MongoDB implementation later.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  updateById(id: string, changes: Partial<Pick<User, 'username' | 'email'>>): Promise<User | null>;
}
