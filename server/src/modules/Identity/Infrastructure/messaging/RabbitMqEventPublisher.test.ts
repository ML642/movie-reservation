import * as amqp from 'amqplib';
import { RabbitMqEventPublisher } from './RabbitMqEventPublisher';

jest.mock('amqplib', () => ({ connect: jest.fn() }));

test('binds the queue before publishing and waits for broker confirmation before closing', async () => {
  const channel = {
    assertExchange: jest.fn().mockResolvedValue({}),
    assertQueue: jest.fn().mockResolvedValue({}),
    bindQueue: jest.fn().mockResolvedValue({}),
    publish: jest.fn().mockReturnValue(true),
    waitForConfirms: jest.fn().mockImplementation(async () => {
      expect(channel.publish).toHaveBeenCalled();
      expect(channel.close).not.toHaveBeenCalled();
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  channel.publish.mockImplementation(() => {
    expect(channel.bindQueue).toHaveBeenCalled();
    return true;
  });
  const connection = { createConfirmChannel: jest.fn().mockResolvedValue(channel), close: jest.fn().mockResolvedValue(undefined) };
  jest.mocked(amqp.connect).mockResolvedValue(connection as unknown as Awaited<ReturnType<typeof amqp.connect>>);
  const event = { name: 'identity.user.registered', occurredAt: '2026-11-08T12:00:00Z', payload: { userId: 'u-1' } };
  await new RabbitMqEventPublisher('amqp://localhost').publish(event);
  expect(channel.publish).toHaveBeenCalledWith('domain-events', event.name, Buffer.from(JSON.stringify(event)), expect.objectContaining({ persistent: true }));
  expect(channel.waitForConfirms).toHaveBeenCalledTimes(1);
  expect(channel.close).toHaveBeenCalledTimes(1);
  expect(connection.close).toHaveBeenCalledTimes(1);
});
