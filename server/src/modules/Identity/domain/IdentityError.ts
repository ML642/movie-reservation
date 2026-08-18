export type IdentityErrorCode =
  | 'MISSING_REQUIRED_FIELDS'
  | 'MISSING_CREDENTIALS'
  | 'NO_PROFILE_CHANGES'
  | 'INVALID_CREDENTIALS'
  | 'USER_EXISTS'
  | 'STORAGE_UNAVAILABLE'
  | 'CONFIGURATION_ERROR'
  | 'INVALID_OAUTH_RESPONSE'
  | 'OAUTH_ACCOUNT_NOT_LINKED';

export class IdentityError extends Error {
  readonly code: IdentityErrorCode;

  constructor(code: IdentityErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
