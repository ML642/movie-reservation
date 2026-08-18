import { describe, expect, jest, test } from '@jest/globals';
import type { User } from '../../domain/users_interfaces';
import { IdentityService } from '../IdentityService';
import type { PasswordHasher } from '../ports/PasswordHasher';
import type { TokenProvider } from '../ports/TokenProvider';
import type { UserRepository } from '../ports/UserRepository';

const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1', username: 'mike', email: 'mike@example.com', password: 'hashed-password', ...overrides,
});

const createSut = () => {
  const repository: jest.Mocked<UserRepository> = {
    findByEmail: jest.fn<UserRepository['findByEmail']>().mockResolvedValue(null),
    findByUsername: jest.fn<UserRepository['findByUsername']>().mockResolvedValue(null),
    findById: jest.fn<UserRepository['findById']>(),
    create: jest.fn<UserRepository['create']>().mockImplementation(async (input) => createUser(input)),
    updateById: jest.fn<UserRepository['updateById']>(),
    getRefreshTokenHash: jest.fn<UserRepository['getRefreshTokenHash']>(),
    replaceRefreshTokenHash: jest.fn<UserRepository['replaceRefreshTokenHash']>().mockResolvedValue(true),
  };

  const passwordHasher: jest.Mocked<PasswordHasher> = {
    hash: jest.fn<PasswordHasher['hash']>().mockResolvedValue('hashed-password'),
    compare: jest.fn<PasswordHasher['compare']>(),
  };

  const tokenProvider: jest.Mocked<TokenProvider> = {
    issue: jest.fn<TokenProvider['issue']>().mockReturnValue('jwt-token'),
    verify: jest.fn<TokenProvider['verify']>(),
    issueRefresh: jest.fn<TokenProvider['issueRefresh']>().mockReturnValue('refresh-token'),
    verifyRefresh: jest.fn<TokenProvider['verifyRefresh']>(),
  };

  return {
    service: new IdentityService(repository, passwordHasher, tokenProvider),
    repository,
    passwordHasher,
    tokenProvider,
  };
};

describe('IdentityService registration', () => {
  test('registers a new user', async () => {
    const { service, repository, passwordHasher, tokenProvider } = createSut();

    const result = await service.register({
      username: 'mike',
      email: 'mike@example.com',
      password: 'Pass12345!',
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('Pass12345!');
    expect(repository.create).toHaveBeenCalledWith({
      username: 'mike',
      email: 'mike@example.com',
      password: 'hashed-password',
    });
    expect(tokenProvider.issue).toHaveBeenCalledWith({
      userId: 'user-1',
      username: 'mike',
      userEmail: 'mike@example.com',
    });
    expect(result).toEqual({
      token: 'jwt-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        username: 'mike',
        email: 'mike@example.com',
      },
    });
  });

  test('rejects a duplicate username', async () => {
    const { service, repository } = createSut();
    repository.findByUsername.mockResolvedValue(createUser());

    await expect(
      service.register({
        username: 'mike',
        email: 'another@example.com',
        password: 'Pass12345!',
      })
    ).rejects.toMatchObject({ code: 'USER_EXISTS' });

    expect(repository.create).not.toHaveBeenCalled();
  });

  test('rejects a duplicate email', async () => {
    const { service, repository } = createSut();
    repository.findByEmail.mockResolvedValue(createUser());

    await expect(
      service.register({
        username: 'mike_different',
        email: 'mike@example.com',
        password: 'Pass12345!',
      })
    ).rejects.toMatchObject({ code: 'USER_EXISTS' });

    expect(repository.create).not.toHaveBeenCalled();
  });
});
