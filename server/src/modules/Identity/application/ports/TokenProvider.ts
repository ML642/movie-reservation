export interface TokenPayload {
  userId: string;
  username: string;
  userEmail: string;
}

export interface TokenProvider {
  issue(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
  issueRefresh(payload: TokenPayload): string;
  verifyRefresh(token: string): TokenPayload;
}
