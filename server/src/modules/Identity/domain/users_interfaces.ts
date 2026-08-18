export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  oauthProvider?: 'google' | 'github';
  oauthSubject?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NewUserInput {
  username: string;
  email: string;
  password: string;
  oauthProvider?: 'google' | 'github';
  oauthSubject?: string;
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
