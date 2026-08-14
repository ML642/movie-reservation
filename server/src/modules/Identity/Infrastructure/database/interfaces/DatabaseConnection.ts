export type DatabaseConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'unknown';


export interface DatabaseConnection {
  connect(): Promise<void>;
  isReady(): boolean;
  getState(): DatabaseConnectionState;
}
