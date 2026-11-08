import type { Channel } from 'amqplib';
import { ensureRegistrationQueue, REGISTRATION_EVENT, REGISTRATION_QUEUE } from './registrationQueue';

type ConsumerChannel = Pick<Channel,
  'assertExchange' | 'assertQueue' | 'bindQueue' | 'prefetch' | 'consume' | 'ack' | 'reject'>;

export const consumeRegistrations = async (
  channel: ConsumerChannel,
  logger: Pick<Console, 'info' | 'error'> = console
): Promise<void> => {
  await ensureRegistrationQueue(channel);
  await channel.prefetch(1);
  await channel.consume(REGISTRATION_QUEUE, (message) => {
    if (!message) return;
    try {
      const event = JSON.parse(message.content.toString('utf8'));
      if (event?.name !== REGISTRATION_EVENT ||
          typeof event?.payload?.userId !== 'string' || !event.payload.userId.trim() ||
          typeof event?.occurredAt !== 'string' || Number.isNaN(Date.parse(event.occurredAt))) {
        throw new Error('Invalid registration event');
      }
      logger.info('User registered', { userId: event.payload.userId, occurredAt: event.occurredAt });
    } catch {
      logger.error('Registration event rejected');
      channel.reject(message, false);
      return;
    }
    channel.ack(message);
  }, { noAck: false });
};
