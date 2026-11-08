import { consumeRegistrations } from './consumeRegistrations';
import { REGISTRATION_EVENT, REGISTRATION_QUEUE } from './registrationQueue';
import type { ConsumeMessage } from 'amqplib';

const fixture = () => {
  let deliver!: (message: ConsumeMessage | null) => void;
  const channel = {
    assertExchange: jest.fn().mockResolvedValue({}),
    assertQueue: jest.fn().mockResolvedValue({}),
    bindQueue: jest.fn().mockResolvedValue({}),
    prefetch: jest.fn().mockResolvedValue({}),
    consume: jest.fn().mockImplementation(async (_queue, handler) => {
      deliver = handler;
      return { consumerTag: 'test' };
    }),
    ack: jest.fn(),
    reject: jest.fn(),
  };
  const logger = { info: jest.fn(), error: jest.fn() };
  return { channel, logger, deliver: (message: ConsumeMessage | null) => deliver(message) };
};

const message = (content: string) => ({ content: Buffer.from(content) } as ConsumeMessage);
const validEvent = { name: REGISTRATION_EVENT, occurredAt: '2026-11-08T12:00:00Z', payload: { userId: 'u-1' } };

test('binds a durable queue and acknowledges only after handling a registration', async () => {
  const f = fixture();
  await consumeRegistrations(f.channel, f.logger);
  expect(f.channel.assertQueue).toHaveBeenCalledWith(REGISTRATION_QUEUE, { durable: true });
  expect(f.channel.bindQueue).toHaveBeenCalledWith(REGISTRATION_QUEUE, 'domain-events', REGISTRATION_EVENT);
  expect(f.channel.prefetch).toHaveBeenCalledWith(1);
  const eventMessage = message(JSON.stringify(validEvent));
  f.logger.info.mockImplementation(() => expect(f.channel.ack).not.toHaveBeenCalled());
  f.deliver(eventMessage);
  expect(f.logger.info).toHaveBeenCalledWith('User registered', { userId: 'u-1', occurredAt: validEvent.occurredAt });
  expect(f.channel.ack).toHaveBeenCalledWith(eventMessage);
  expect(f.channel.reject).not.toHaveBeenCalled();
});

test.each([
  'not-json',
  'null',
  JSON.stringify({ ...validEvent, name: 'unexpected' }),
  JSON.stringify({ ...validEvent, payload: {} }),
  JSON.stringify({ ...validEvent, occurredAt: 'invalid' }),
])('rejects malformed events without a requeue loop: %s', async (content) => {
  const f = fixture();
  await consumeRegistrations(f.channel, f.logger);
  const eventMessage = message(content);
  f.deliver(eventMessage);
  expect(f.channel.reject).toHaveBeenCalledWith(eventMessage, false);
  expect(f.channel.ack).not.toHaveBeenCalled();
  expect(f.logger.info).not.toHaveBeenCalled();
});

test('does not acknowledge an event when its handler fails', async () => {
  const f = fixture();
  await consumeRegistrations(f.channel, f.logger);
  f.logger.info.mockImplementation(() => { throw new Error('log unavailable'); });
  const eventMessage = message(JSON.stringify(validEvent));
  f.deliver(eventMessage);
  expect(f.channel.ack).not.toHaveBeenCalled();
  expect(f.channel.reject).toHaveBeenCalledWith(eventMessage, false);
});

test('ignores broker cancellation notifications', async () => {
  const f = fixture();
  await consumeRegistrations(f.channel, f.logger);
  f.deliver(null);
  expect(f.channel.ack).not.toHaveBeenCalled();
  expect(f.channel.reject).not.toHaveBeenCalled();
});
