import amqp from "amqplib";

let channel;

export async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBIT_URL);
  channel = await connection.createChannel();
  await channel.assertExchange("order_created", "fanout", { durable: false });
  console.log("🐇 [Notification] Connected to RabbitMQ");
}

export async function subscribe(queue, callback) {
  if (!channel) throw new Error("RabbitMQ not connected");
  await channel.assertQueue(queue, { durable: false });
  await channel.bindQueue(queue, "order_created", "");
  channel.consume(queue, (msg) => {
    const data = JSON.parse(msg.content.toString());
    callback(data);
    channel.ack(msg);
  });
}
