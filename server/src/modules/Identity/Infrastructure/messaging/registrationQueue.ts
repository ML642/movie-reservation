import type { Channel } from 'amqplib';

export const REGISTRATION_QUEUE = 'registration-audit';
export const REGISTRATION_EVENT = 'identity.user.registered';
export const DOMAIN_EXCHANGE = 'domain-events';

export const ensureRegistrationQueue = async (
  channel: Pick<Channel, 'assertExchange' | 'assertQueue' | 'bindQueue'>,
  exchange = DOMAIN_EXCHANGE
): Promise<void> => {
  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertQueue(REGISTRATION_QUEUE, { durable: true });
  await channel.bindQueue(REGISTRATION_QUEUE, exchange, REGISTRATION_EVENT);
};
