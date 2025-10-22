#!/usr/bin/env node

import fetch from "node-fetch";

const BASE_URLS = {
  auth: "http://localhost:3000",
  order: "http://localhost:4001",
  notification: "http://localhost:5000",
};

async function testPubSub() {
  console.log("🧪 Testing Pub/Sub System...\n");

  try {
    // Test 1: Create a product (should trigger PRODUCT_CREATED event)
    console.log("1️⃣ Testing Product Creation...");
    const productResponse = await fetch(`${BASE_URLS.auth}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Product",
        price: 99.99,
      }),
    });

    if (productResponse.ok) {
      const product = await productResponse.json();
      console.log("✅ Product created:", product);
    } else {
      console.log("❌ Failed to create product");
    }

    // Wait a bit for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 2: Update the product (should trigger PRODUCT_UPDATED event)
    console.log("\n2️⃣ Testing Product Update...");
    const updateResponse = await fetch(`${BASE_URLS.auth}/products/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Test Product",
        price: 149.99,
      }),
    });

    if (updateResponse.ok) {
      const product = await updateResponse.json();
      console.log("✅ Product updated:", product);
    } else {
      console.log("❌ Failed to update product");
    }

    // Wait a bit for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 3: Create an order (should trigger ORDER_CREATED event)
    console.log("\n3️⃣ Testing Order Creation...");
    const orderResponse = await fetch(`${BASE_URLS.order}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: 1,
        quantity: 2,
        price: 149.99,
      }),
    });

    if (orderResponse.ok) {
      const order = await orderResponse.json();
      console.log("✅ Order created:", order);
    } else {
      console.log("❌ Failed to create order");
    }

    // Wait a bit for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 4: Test notification service directly
    console.log("\n4️⃣ Testing Notification Service...");
    const notificationResponse = await fetch(
      `${BASE_URLS.notification}/test-publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: "system_events",
          message: {
            event: "TEST_EVENT",
            data: { message: "Test message from script" },
            timestamp: new Date().toISOString(),
          },
        }),
      }
    );

    if (notificationResponse.ok) {
      const result = await notificationResponse.json();
      console.log("✅ Test message published:", result);
    } else {
      console.log("❌ Failed to publish test message");
    }

    console.log("\n🎉 Pub/Sub testing completed!");
    console.log("\n📋 Check the following:");
    console.log("- Frontend should show real-time logs");
    console.log("- Notification service logs should show received events");
    console.log("- Order service should have updated orders with new prices");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Check if services are running
async function checkServices() {
  console.log("🔍 Checking if services are running...\n");

  const services = [
    { name: "Auth-Product-User Service", url: BASE_URLS.auth },
    { name: "Order Service", url: BASE_URLS.order },
    { name: "Notification Service", url: BASE_URLS.notification },
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url);
      if (response.ok) {
        console.log(`✅ ${service.name} is running`);
      } else {
        console.log(`❌ ${service.name} is not responding properly`);
      }
    } catch (error) {
      console.log(`❌ ${service.name} is not running (${error.message})`);
    }
  }
  console.log("");
}

// Main execution
async function main() {
  await checkServices();
  await testPubSub();
}

main().catch(console.error);
