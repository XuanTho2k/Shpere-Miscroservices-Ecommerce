import amqp from "amqplib";

let connection;
let channel;

export const connectToRabbitMQ = async () => {
  try {
    connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    // Tạo các exchanges cho pub/sub pattern
    await channel.assertExchange("product_events", "fanout", { durable: true });
    await channel.assertExchange("order_events", "fanout", { durable: true });
    await channel.assertExchange("system_events", "fanout", { durable: true });

    console.log("🐇 [Order] Connected to RabbitMQ");
  } catch (error) {
    console.error("❌ [Order] RabbitMQ connection failed:", error);
    throw error;
  }
};

// Publish message to exchange (pub/sub pattern)
export const publishToExchange = async (exchange, message) => {
  if (!channel) throw new Error("RabbitMQ channel not found");

  try {
    const messageBuffer = Buffer.from(JSON.stringify(message));
    channel.publish(exchange, "", messageBuffer, { persistent: true });
    console.log(`📤 [${exchange}] Published:`, message);
  } catch (error) {
    console.error(`❌ [${exchange}] Publish failed:`, error);
    throw error;
  }
};

// Subscribe to exchange
export const subscribeToExchange = async (exchange, queueName, callback) => {
  if (!channel) throw new Error("RabbitMQ channel not found");

  try {
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchange, "");

    console.log(`📥 [${exchange}] Subscribed via queue: ${queueName}`);

    channel.consume(queueName, (msg) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`📨 [${exchange}] Received:`, data);
          callback(data);
          channel.ack(msg);
        } catch (error) {
          console.error(`❌ [${exchange}] Error processing message:`, error);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error(`❌ [${exchange}] Subscription failed:`, error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const publishMessage = async (queue, message) => {
  console.warn(
    "⚠️ publishMessage is deprecated, use publishToExchange instead"
  );
  await publishToExchange("system_events", { queue, message });
};

// Legacy function for backward compatibility
export const consumeMessage = async (queue, callback) => {
  console.warn(
    "⚠️ consumeMessage is deprecated, use subscribeToExchange instead"
  );
  await subscribeToExchange("system_events", queue, callback);
};

// Close connection
export const closeConnection = async () => {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
};
