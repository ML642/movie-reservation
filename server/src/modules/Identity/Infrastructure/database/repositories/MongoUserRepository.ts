import mongoose, { type Model } from 'mongoose';
import { IdentityError } from '../../../domain/IdentityError';
import type { NewUserInput, ProfileChanges, User } from '../../../domain/users_interfaces';
import type { UserRepository } from '../../../application/ports/UserRepository';
import type { DatabaseConnection } from '../interfaces/DatabaseConnection';
import type { UserRecord } from '../interfaces/UserRecord';

export class MongoUserRepository implements UserRepository {
  constructor(
    private readonly userModel: Model<UserRecord>,
    private readonly connection: DatabaseConnection
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    this.ensureReady();
    const record = (await this.userModel.findOne({ email }).lean().exec()) as unknown as UserRecord | null;
    return this.toDomain(record);
  }

  async findByUsername(username: string): Promise<User | null> {
    this.ensureReady();
    const record = (await this.userModel.findOne({ username }).lean().exec()) as unknown as UserRecord | null;
    return this.toDomain(record);
  }

  async findById(id: string): Promise<User | null> {
    this.ensureReady();
    const record = (await this.userModel.findOne({ id: String(id || '') }).lean().exec()) as unknown as UserRecord | null;
    return this.toDomain(record);
  }

  async findByOAuthIdentity(provider: 'google' | 'github', subject: string): Promise<User | null> {
    this.ensureReady();
    const record = (await this.userModel.findOne({ oauthProvider: provider, oauthSubject: subject }).lean().exec()) as unknown as UserRecord | null;
    return this.toDomain(record);
  }

  async create(user: NewUserInput): Promise<User> {
    this.ensureReady();

    try {
      const record = await this.userModel.create({
        ...user,
        id: new mongoose.Types.ObjectId().toString(),
      });
      return this.toDomain(record.toObject() as UserRecord) as User;
    } catch (error) {
      throw this.mapDatabaseError(error);
    }
  }

  async updateById(id: string, changes: ProfileChanges): Promise<User | null> {
    this.ensureReady();

    try {
      const record = (await this.userModel
        .findOneAndUpdate({ id: String(id || '') }, { $set: changes }, { new: true })
        .lean()
        .exec()) as unknown as UserRecord | null;
      return this.toDomain(record);
    } catch (error) {
      throw this.mapDatabaseError(error);
    }
  }

  async getRefreshTokenHash(userId: string): Promise<string | null> {
    this.ensureReady();
    const record = await this.userModel.findOne({ id: String(userId || '') }).select('+refreshTokenHash').lean().exec();
    return record?.refreshTokenHash || null;
  }

  async replaceRefreshTokenHash(userId: string, previousHash: string | null, nextHash: string): Promise<boolean> {
    this.ensureReady();
    const query = previousHash ? { id: String(userId || ''), refreshTokenHash: previousHash } : { id: String(userId || ''), refreshTokenHash: { $exists: false } };
    const result = await this.userModel.updateOne(query, { $set: { refreshTokenHash: nextHash } }).exec();
    return result.modifiedCount === 1;
  }

  async clearRefreshTokenHash(userId: string, expectedHash: string): Promise<boolean> {
    this.ensureReady();
    const result = await this.userModel.updateOne(
      { id: String(userId || ''), refreshTokenHash: expectedHash },
      { $unset: { refreshTokenHash: 1 } }
    ).exec();
    return result.modifiedCount === 1;
  }

  private ensureReady(): void {
    if (!this.connection.isReady()) {
      throw new IdentityError('STORAGE_UNAVAILABLE', 'User storage is temporarily unavailable.');
    }
  }

  private toDomain(record: UserRecord | null): User | null {
    if (!record) return null;
    return {
      id: record.id,
      username: record.username,
      email: record.email,
      password: record.password,
      oauthProvider: record.oauthProvider,
      oauthSubject: record.oauthSubject,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapDatabaseError(error: unknown): Error {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return new IdentityError('USER_EXISTS', 'User already exists');
    }

    return error instanceof Error ? error : new Error('User storage operation failed');
  }
}
