import type { User } from '../../../domain/users_interfaces';

export interface UserRecord extends User {
  refreshTokenHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
