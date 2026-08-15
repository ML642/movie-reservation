import { IdentityError } from '../domain/IdentityError';
import {
  createNewUserInput,
  createProfileChanges,
  normalizeEmail,
  normalizeUsername,
  toPublicUser,
  toUserProfile,
  type NewUserInput,
  type PublicUser,
  type UserProfile,
} from '../domain/user';
import type { PasswordHasher } from './ports/PasswordHasher';
import type { TokenProvider } from './ports/TokenProvider';
import type { UserRepository } from './ports/UserRepository';

export interface AuthenticationResult {
  user: PublicUser;
  token: string;
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

    return {
      user: publicUser,
      token: this.tokenProvider.issue({
        userId: publicUser.id,
        username: publicUser.username,
        userEmail: publicUser.email,
      }),
    };
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

    return {
      user: publicUser,
      token: this.tokenProvider.issue({
        userId: publicUser.id,
        username: publicUser.username,
        userEmail: publicUser.email,
      }),
    };
  }

  async findProfileById(id: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findById(id);
    return user ? toUserProfile(user) : null;
  }

  async updateProfile(id: string, input: { newName?: string; newEmail?: string }): Promise<UserProfile | null> {
    const user = await this.userRepository.updateById(id, createProfileChanges(input));
    return user ? toUserProfile(user) : null;
  }
}
