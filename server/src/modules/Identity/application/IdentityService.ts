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

export interface AuthenticationResult {
  user: PublicUser;
  token: string;
  refreshToken: string;
}

export class IdentityService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenProvider: TokenProvider
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
}
