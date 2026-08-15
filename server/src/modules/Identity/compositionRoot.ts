import { IdentityService } from './application/IdentityService';
import { MongooseConnection } from './Infrastructure/database/MongooseConnection';
import { UserModel } from './Infrastructure/database/models/userModel';
import { MongoUserRepository } from './Infrastructure/database/repositories/MongoUserRepository';
import { BcryptPasswordHasher } from './Infrastructure/security/BcryptPasswordHasher';
import { JwtTokenProvider } from './Infrastructure/security/JwtTokenProvider';
import { createAuthController } from './presentation/authController';
import { createAuthRoutes } from './presentation/authRoutes';

const databaseConnection = new MongooseConnection();
const userRepository = new MongoUserRepository(UserModel, databaseConnection);
const passwordHasher = new BcryptPasswordHasher();
const tokenProvider = new JwtTokenProvider();
const identityService = new IdentityService(userRepository, passwordHasher, tokenProvider);
const authController = createAuthController(identityService, tokenProvider);
const authRoutes = createAuthRoutes(authController, tokenProvider);

export { authRoutes, databaseConnection, identityService, tokenProvider };
