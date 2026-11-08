import * as amqp from 'amqplib';
import { ensureRegistrationQueue } from './registrationQueue';
import type { DomainEvent, EventPublisher } from '../../application/ports/EventPublisher';

export class RabbitMqEventPublisher implements EventPublisher {
  constructor(private readonly url: string, private readonly exchange = 'domain-events') {}

  async publish(event: DomainEvent): Promise<void> {
    const connection = await amqp.connect(this.url);
    try {
      const channel = await connection.createConfirmChannel();
      await ensureRegistrationQueue(channel, this.exchange);
      channel.publish(this.exchange, event.name, Buffer.from(JSON.stringify(event)), {
        contentType: 'application/json',
        persistent: true,
        type: event.name,
      });
      await channel.waitForConfirms();
      await channel.close();
    } finally {
      await connection.close();
    }
  }
}
