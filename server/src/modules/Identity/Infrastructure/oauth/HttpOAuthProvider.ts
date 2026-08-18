import type {
  OAuthProfile,
  OAuthProvider,
  OAuthProviderName,
  OAuthProviderRegistry,
} from '../../application/ports/OAuthProvider';
import { IdentityError } from '../../domain/IdentityError';

type Config = {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
};

type TokenResponse = { access_token?: string };
type GoogleUser = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
};
type GitHubUser = { id?: number; login?: string; name?: string; email?: string };
type GitHubEmail = { email?: string; primary?: boolean; verified?: boolean };

export class HttpOAuthProvider implements OAuthProvider {
  constructor(
    public readonly name: OAuthProviderName,
    private readonly config: Config
  ) {}

  getAuthorizationUrl(state: string): string {
    this.ensureConfigured();
    const params = new URLSearchParams({
      client_id: this.config.clientId!,
      redirect_uri: this.config.redirectUri!,
      state,
    });

    if (this.name === 'google') {
      params.set('response_type', 'code');
      params.set('scope', 'openid email profile');
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }

    params.set('scope', 'read:user user:email');
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async authenticate(code: string): Promise<OAuthProfile> {
    this.ensureConfigured();
    if (!code) throw new IdentityError('INVALID_OAUTH_RESPONSE', 'Authorization code is required');

    const token = await this.exchangeCode(code);
    return this.name === 'google' ? this.loadGoogleProfile(token) : this.loadGitHubProfile(token);
  }

  private async exchangeCode(code: string): Promise<string> {
    const endpoint = this.name === 'google'
      ? 'https://oauth2.googleapis.com/token'
      : 'https://github.com/login/oauth/access_token';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        redirect_uri: this.config.redirectUri!,
        code,
      }),
    });
    const body = await response.json() as TokenResponse;

    if (!response.ok || !body.access_token) {
      throw new IdentityError('INVALID_OAUTH_RESPONSE', 'OAuth provider did not issue an access token');
    }
    return body.access_token;
  }

  private async loadGoogleProfile(token: string): Promise<OAuthProfile> {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await response.json() as GoogleUser;

    if (!response.ok || !user.sub || !user.email || !user.email_verified) {
      throw new IdentityError('INVALID_OAUTH_RESPONSE', 'Google did not return a verified email address');
    }
    return {
      provider: 'google',
      subject: user.sub,
      email: user.email,
      username: user.name || user.given_name || user.email.split('@')[0],
    };
  }

  private async loadGitHubProfile(token: string): Promise<OAuthProfile> {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'movie-reservation',
    };
    const [userResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', { headers }),
      fetch('https://api.github.com/user/emails', { headers }),
    ]);
    const user = await userResponse.json() as GitHubUser;
    const emails = await emailsResponse.json() as GitHubEmail[];
    const email = emails.find((item) => item.primary && item.verified)?.email
      || emails.find((item) => item.verified)?.email
      || user.email;

    if (!userResponse.ok || !user.id || !email) {
      throw new IdentityError('INVALID_OAUTH_RESPONSE', 'GitHub did not return a verified email address');
    }
    return {
      provider: 'github',
      subject: String(user.id),
      email,
      username: user.name || user.login || email.split('@')[0],
    };
  }

  private ensureConfigured(): void {
    const { clientId, clientSecret, redirectUri } = this.config;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new IdentityError('CONFIGURATION_ERROR', `${this.name} OAuth is not configured`);
    }
  }
}

export class OAuthProviders implements OAuthProviderRegistry {
  private readonly providers: OAuthProvider[] = [
    new HttpOAuthProvider('google', {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    }),
    new HttpOAuthProvider('github', {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.GITHUB_OAUTH_REDIRECT_URI,
    }),
  ];

  get(name: string): OAuthProvider | null {
    return this.providers.find((provider) => provider.name === name) || null;
  }
}
