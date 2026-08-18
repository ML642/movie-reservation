export type OAuthProviderName = 'google' | 'github';

export interface OAuthProfile {
  provider: OAuthProviderName;
  subject: string;
  email: string;
  username: string;
}

export interface OAuthProvider {
  readonly name: OAuthProviderName;
  getAuthorizationUrl(state: string): string;
  authenticate(code: string): Promise<OAuthProfile>;
}

export interface OAuthProviderRegistry {
  get(provider: string): OAuthProvider | null;
}
