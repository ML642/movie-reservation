import { IdentityService } from './application/IdentityService';
import type { DatabaseConnection } from './Infrastructure/database/interfaces/DatabaseConnection';
import { UserModel } from './Infrastructure/database/models/userModel';
import { MongoUserRepository } from './Infrastructure/database/repositories/MongoUserRepository';
import { BcryptPasswordHasher } from './Infrastructure/security/BcryptPasswordHasher';
import { JwtTokenProvider } from './Infrastructure/security/JwtTokenProvider';
import { OAuthProviders } from './Infrastructure/oauth/HttpOAuthProvider';
import { createAuthController } from './presentation/authController';
import { createAuthRoutes } from './presentation/authRoutes';

export const createIdentityModule = (databaseConnection: DatabaseConnection) => {
  const userRepository = new MongoUserRepository(UserModel, databaseConnection);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenProvider = new JwtTokenProvider();
  const identityService = new IdentityService(userRepository, passwordHasher, tokenProvider);
  const authController = createAuthController(identityService, tokenProvider, new OAuthProviders());

  return {
    authRoutes: createAuthRoutes(authController, tokenProvider),
    tokenProvider,
  };
};
