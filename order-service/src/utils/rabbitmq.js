import amqp from "amqplib";

let channel;

export const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
  } catch (error) {
    console.log("Error connecting to RabbitMQ", error);
  }
};

export const publishMessage = async (queue, message) => {
  if (!channel) throw new Error("RabbitMQ channel not found");
  await channel.assertQueue(queue, { durable: false });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  console.log(`Message sent to ${queue}: ${JSON.stringify(message)}`);
};

export const consumeMessage = async (queue, callback) => {
  if (!channel) throw new Error("RabbitMQ channel not found");
  await channel.assertQueue(queue, { durable: false });
  channel.consume(queue, (message) => {
    if (message) {
      const data = JSON.parse(message.content.toString());
      callback(data);
      channel.ack(message);
    }
  });
};
