export type ReservationErrorCode =
  | 'MISSING_FIELDS'
  | 'INVALID_SHOW'
  | 'INVALID_SEATS'
  | 'CONFLICT_SEATS'
  | 'FORBIDDEN'
  | 'STORAGE_UNAVAILABLE';

export class ReservationError extends Error {
  readonly code: ReservationErrorCode;
  readonly conflictingSeats?: string[];

  constructor(code: ReservationErrorCode, message: string, conflictingSeats?: string[]) {
    super(message);
    this.code = code;
    this.conflictingSeats = conflictingSeats;
  }
}
