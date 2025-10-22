import amqp from "amqplib";

let connection;
let channel;

export async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(
      process.env.RABBIT_URL || "amqp://localhost"
    );
    channel = await connection.createChannel();

    // Tạo các exchanges cho pub/sub pattern
    await channel.assertExchange("product_events", "fanout", { durable: true });
    await channel.assertExchange("order_events", "fanout", { durable: true });
    await channel.assertExchange("system_events", "fanout", { durable: true });

    console.log("🐇 [Notification] Connected to RabbitMQ");
  } catch (error) {
    console.error("❌ [Notification] RabbitMQ connection failed:", error);
    throw error;
  }
}

export async function subscribe(queue, callback) {
  if (!channel) throw new Error("RabbitMQ not connected");

  try {
    // Tạo queue với tên duy nhất cho notification service
    const queueName = `notification_${queue}`;
    await channel.assertQueue(queueName, {
      durable: true,
      exclusive: false,
    });

    // Bind queue với exchange tương ứng
    let exchangeName;
    switch (queue) {
      case "product_updates":
        exchangeName = "product_events";
        break;
      case "order_created":
        exchangeName = "order_events";
        break;
      case "system_logs":
        exchangeName = "system_events";
        break;
      default:
        exchangeName = "system_events";
    }

    await channel.bindQueue(queueName, exchangeName, "");

    console.log(`📥 [Notification] Subscribed to ${queue} via ${exchangeName}`);

    channel.consume(queueName, (msg) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`📨 [${queue}] Received:`, data);
          callback(data);
          channel.ack(msg);
        } catch (error) {
          console.error(`❌ [${queue}] Error processing message:`, error);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error(`❌ [${queue}] Subscription failed:`, error);
    throw error;
  }
}

export async function publish(exchange, message) {
  if (!channel) throw new Error("RabbitMQ not connected");

  try {
    const messageBuffer = Buffer.from(JSON.stringify(message));
    channel.publish(exchange, "", messageBuffer, { persistent: true });
    console.log(`📤 [${exchange}] Published:`, message);
  } catch (error) {
    console.error(`❌ [${exchange}] Publish failed:`, error);
    throw error;
  }
}

export async function closeConnection() {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
}
