import { IdentityError } from '../domain/IdentityError';
import {
  createNewUserInput,
  createProfileChanges,
  normalizeEmail,
  normalizeUsername,
  toPublicUser,
  toUserProfile,
} from '../domain/user';
import type { NewUserInput, PublicUser, UserProfile } from '../domain/users_interfaces';
import type { PasswordHasher } from './ports/PasswordHasher';
import type { TokenProvider } from './ports/TokenProvider';
import type { UserRepository } from './ports/UserRepository';
import type { OAuthProfile } from './ports/OAuthProvider';
import { NoopEventPublisher, type EventPublisher } from './ports/EventPublisher';

export interface AuthenticationResult {
  user: PublicUser;
  token: string;
  refreshToken: string;
}

export class IdentityService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenProvider: TokenProvider,
    private readonly eventPublisher: EventPublisher = new NoopEventPublisher()
  ) {}

  async register(input: NewUserInput): Promise<AuthenticationResult> {
    const newUser = createNewUserInput(input);
    const [userWithEmail, userWithUsername] = await Promise.all([
      this.userRepository.findByEmail(newUser.email),
      this.userRepository.findByUsername(newUser.username),
    ]);

    if (userWithEmail || userWithUsername) {
      throw new IdentityError('USER_EXISTS', 'User already exists');
    }

    const password = await this.passwordHasher.hash(newUser.password);
    const user = await this.userRepository.create({ ...newUser, password });
    const publicUser = toPublicUser(user);
    await this.publishUserRegistered(publicUser.id);

    return this.createAuthenticationResult(publicUser);
  }

  async login(loginId: string, password: string): Promise<AuthenticationResult> {
    const normalizedLoginId = String(loginId || '').trim();

    if (!normalizedLoginId || !password) {
      throw new IdentityError('MISSING_CREDENTIALS', 'Email/username and password are required');
    }

    const user =
      (await this.userRepository.findByEmail(normalizeEmail(normalizedLoginId))) ||
      (await this.userRepository.findByUsername(normalizeUsername(normalizedLoginId)));

    if (!user || !(await this.passwordHasher.compare(password, user.password))) {
      throw new IdentityError('INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const publicUser = toPublicUser(user);

    return this.createAuthenticationResult(publicUser, await this.userRepository.getRefreshTokenHash(publicUser.id));
  }

  async refresh(refreshToken: string): Promise<AuthenticationResult> {
    let payload;
    try { payload = this.tokenProvider.verifyRefresh(refreshToken); } catch {
      throw new IdentityError('INVALID_CREDENTIALS', 'Invalid or expired refresh token');
    }
    const user = await this.userRepository.findById(payload.userId);
    const storedHash = await this.userRepository.getRefreshTokenHash(payload.userId);
    if (!user || !storedHash || !(await this.passwordHasher.compare(refreshToken, storedHash))) {
      throw new IdentityError('INVALID_CREDENTIALS', 'Invalid or expired refresh token');
    }
    return this.createAuthenticationResult(toPublicUser(user), storedHash);
  }

  async logout(refreshToken: string): Promise<void> {
    let payload;
    try { payload = this.tokenProvider.verifyRefresh(refreshToken); } catch {
      return;
    }

    const storedHash = await this.userRepository.getRefreshTokenHash(payload.userId);
    if (!storedHash || !(await this.passwordHasher.compare(refreshToken, storedHash))) return;
    await this.userRepository.clearRefreshTokenHash(payload.userId, storedHash);
  }

  async loginWithOAuth(profile: OAuthProfile): Promise<AuthenticationResult> {
    const linkedUser = await this.userRepository.findByOAuthIdentity(profile.provider, profile.subject);
    if (linkedUser) {
      const previousRefreshHash = await this.userRepository.getRefreshTokenHash(linkedUser.id);
      return this.createAuthenticationResult(toPublicUser(linkedUser), previousRefreshHash);
    }

    const email = normalizeEmail(profile.email);
    if (await this.userRepository.findByEmail(email)) {
      throw new IdentityError(
        'OAUTH_ACCOUNT_NOT_LINKED',
        'This email already belongs to a password account. Sign in with your password first.'
      );
    }

    const username = await this.createAvailableOAuthUsername(profile.username, profile.provider, profile.subject);
    const password = await this.passwordHasher.hash(`${profile.provider}:${profile.subject}:${crypto.randomUUID()}`);
    const user = await this.userRepository.create({
      username,
      email,
      password,
      oauthProvider: profile.provider,
      oauthSubject: profile.subject,
    });
    await this.publishUserRegistered(user.id);
    return this.createAuthenticationResult(toPublicUser(user));
  }

  async findProfileById(id: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findById(id);
    return user ? toUserProfile(user) : null;
  }

  async updateProfile(id: string, input: { newName?: string; newEmail?: string }): Promise<UserProfile | null> {
    const user = await this.userRepository.updateById(id, createProfileChanges(input));
    return user ? toUserProfile(user) : null;
  }

  private async createAuthenticationResult(publicUser: PublicUser, previousRefreshHash: string | null = null): Promise<AuthenticationResult> {
    const payload = { userId: publicUser.id, username: publicUser.username, userEmail: publicUser.email };
    const refreshToken = this.tokenProvider.issueRefresh(payload);
    const replaced = await this.userRepository.replaceRefreshTokenHash(
      publicUser.id, previousRefreshHash, await this.passwordHasher.hash(refreshToken)
    );
    if (!replaced) throw new IdentityError('INVALID_CREDENTIALS', 'Refresh token was already used');
    return { user: publicUser, token: this.tokenProvider.issue(payload), refreshToken };
  }

  private async createAvailableOAuthUsername(value: string, provider: string, subject: string): Promise<string> {
    const normalized = normalizeUsername(value)
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');
    const base = normalized.slice(0, 22) || provider;
    const suffix = `${provider}_${subject}`.replace(/[^a-zA-Z0-9_]/g, '').slice(-12);
    let username = `${base}_${suffix}`.slice(0, 30);
    let index = 2;
    while (await this.userRepository.findByUsername(username)) {
      username = `${base.slice(0, 25)}_${index++}`;
    }
    return username;
  }

  private publishUserRegistered(userId: string): Promise<void> {
    return this.eventPublisher.publish({
      name: 'identity.user.registered',
      occurredAt: new Date().toISOString(),
      payload: { userId },
    });
  }
}
