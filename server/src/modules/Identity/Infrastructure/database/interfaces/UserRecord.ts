import type { User } from '../../../domain/users_interfaces';

export interface UserRecord extends User {
  createdAt?: Date;
  updatedAt?: Date;
}
