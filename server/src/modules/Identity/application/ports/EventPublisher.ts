export interface DomainEvent {
  name: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export class NoopEventPublisher implements EventPublisher {
  async publish(): Promise<void> {}
}
