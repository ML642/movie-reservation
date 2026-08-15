export type EngagementErrorCode =
  | 'INVALID_MOVIE'
  | 'INVALID_COMMENT'
  | 'FORBIDDEN'
  | 'STORAGE_UNAVAILABLE';

export class EngagementError extends Error {
  readonly code: EngagementErrorCode;

  constructor(code: EngagementErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
