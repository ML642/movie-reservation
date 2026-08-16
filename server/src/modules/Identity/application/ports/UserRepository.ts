import type { NewUserInput, ProfileChanges, User } from '../../domain/users_interfaces';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: NewUserInput): Promise<User>;
  updateById(id: string, changes: ProfileChanges): Promise<User | null>;
}
