require('dotenv').config();
const amqp = require('amqplib');
const { consumeRegistrations } = require('../build/Identity/Infrastructure/messaging/consumeRegistrations');

const start = async () => {
  if (!process.env.RABBITMQ_URL) throw new Error('RABBITMQ_URL must be configured');
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  let stopping = false;
  connection.on('error', () => console.error('Registration worker RabbitMQ connection failed'));
  connection.on('close', () => {
    if (!stopping) process.exit(1);
  });
  const channel = await connection.createChannel();
  channel.on('error', () => {
    console.error('Registration worker RabbitMQ channel failed');
    process.exit(1);
  });
  channel.on('close', () => {
    if (!stopping) process.exit(1);
  });
  await consumeRegistrations(channel);
  console.info('Registration worker listening');
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await channel.close();
    await connection.close();
  };
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => stop().catch(() => process.exit(1)));
  }
};

start().catch(() => {
  console.error('Registration worker failed to start');
  process.exit(1);
});
