import type { User } from '../../../domain/user';

export interface UserRecord extends User {
  createdAt?: Date;
  updatedAt?: Date;
}
