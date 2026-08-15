export interface TokenVerifier {
  verify(token: string): {
    userId: string;
    username: string;
  };
}
