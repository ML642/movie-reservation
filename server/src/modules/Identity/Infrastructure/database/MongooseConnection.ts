import mongoose from 'mongoose';
import { IdentityError } from '../../domain/IdentityError';
import type { DatabaseConnection, DatabaseConnectionState } from './interfaces/DatabaseConnection';

export class MongooseConnection implements DatabaseConnection {
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.isReady()) return;
    if (this.connectionPromise) return this.connectionPromise;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new IdentityError('CONFIGURATION_ERROR', 'MONGODB_URI must be configured');
    }

    this.connectionPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then(() => undefined)
      .finally(() => {
        this.connectionPromise = null;
      });

    return this.connectionPromise;
  }

  isReady(): boolean {
    return mongoose.connection.readyState === 1;
  }

  getState(): DatabaseConnectionState {
    const states: Record<number, DatabaseConnectionState> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return states[mongoose.connection.readyState] || 'unknown';
  }
}
