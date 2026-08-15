import mongoose from 'mongoose';

export type DatabaseState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'unknown';

export class MongooseDatabase {
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.isReady()) return;
    if (this.connectionPromise) return this.connectionPromise;

    const uri = this.getUri();
    if (!uri) throw new Error('MONGODB_URI must be configured');

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

  getState(): DatabaseState {
    const states: Record<number, DatabaseState> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }

  private getUri(): string {
    const rawUri = process.env.MONGODB_URI || process.env.MoNGO_DB || '';
    const password = process.env.MONGO_DB_PASSWORD || process.env.MONGO_DB_PASSWD || '';
    return password
      ? rawUri.replace(/<db_password>/g, encodeURIComponent(password)).replace(/<password>/g, encodeURIComponent(password))
      : rawUri;
  }
}

export const database = new MongooseDatabase();
