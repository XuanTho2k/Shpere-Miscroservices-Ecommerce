# 🚀 Pub/Sub System Guide

Hệ thống Pub/Sub sử dụng RabbitMQ để giao tiếp giữa các microservices và frontend real-time.

## 📋 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Notification   │    │   RabbitMQ      │
│   (React)       │◄───┤   Service       │◄───┤   (Exchanges)   │
│   Port: 5173    │    │   Port: 5000    │    │   Port: 5672    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌────────┴────────┐
                       │                 │
              ┌────────▼────────┐ ┌──────▼──────┐
              │ Auth-Product-   │ │ Order       │
              │ User Service    │ │ Service     │
              │ Port: 3000      │ │ Port: 4001  │
              └─────────────────┘ └─────────────┘
```

## 🔄 Exchanges & Events

### 1. Product Events (`product_events`)

- **PRODUCT_CREATED**: Khi tạo sản phẩm mới
- **PRODUCT_UPDATED**: Khi cập nhật thông tin sản phẩm
- **PRODUCT_PRICE_UPDATED**: Khi cập nhật giá sản phẩm
- **PRODUCT_DELETED**: Khi xóa sản phẩm

### 2. Order Events (`order_events`)

- **ORDER_CREATED**: Khi tạo đơn hàng mới
- **ORDER_UPDATED**: Khi cập nhật đơn hàng
- **ORDER_STATUS_UPDATED**: Khi thay đổi trạng thái đơn hàng

### 3. System Events (`system_events`)

- **TEST_EVENT**: Event test
- **SYSTEM_LOG**: Log hệ thống

## 🚀 Cách chạy hệ thống

### 1. Khởi động RabbitMQ

```bash
# Sử dụng Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Hoặc cài đặt local
brew install rabbitmq
brew services start rabbitmq
```

### 2. Khởi động các services

#### Auth-Product-User Service

```bash
cd auth-product-user-service
npm install
npm start
```

#### Order Service

```bash
cd order-service
npm install
npm start
```

#### Notification Service

```bash
cd notification-service
npm install
npm start
```

#### Frontend

```bash
cd front-end
npm install
npm run dev
```

### 3. Test hệ thống

```bash
# Chạy script test
node test-pubsub.js
```

## 📡 Real-time Events

### Frontend nhận được các events:

- `product_update`: Cập nhật sản phẩm
- `product_created`: Tạo sản phẩm mới
- `product_deleted`: Xóa sản phẩm
- `order_created`: Tạo đơn hàng mới
- `order_updated`: Cập nhật đơn hàng
- `order_event`: Event đơn hàng khác
- `log_event`: Log hệ thống

## 🔧 API Endpoints

### Auth-Product-User Service (Port 3000)

- `POST /products` - Tạo sản phẩm
- `PUT /products/:id` - Cập nhật sản phẩm
- `DELETE /products/:id` - Xóa sản phẩm
- `PUT /products/:id/price` - Cập nhật giá

### Order Service (Port 4001)

- `POST /orders` - Tạo đơn hàng
- `GET /orders` - Lấy danh sách đơn hàng
- `PUT /orders` - Cập nhật đơn hàng
- `PUT /orders/:id/status` - Cập nhật trạng thái

### Notification Service (Port 5000)

- `GET /` - Health check
- `POST /test-publish` - Test publish message

## 🐛 Debugging

### 1. Kiểm tra RabbitMQ Management UI

Truy cập: http://localhost:15672

- Username: guest
- Password: guest

### 2. Kiểm tra logs

```bash
# Auth service logs
tail -f auth-product-user-service/logs/*.log

# Order service logs
tail -f order-service/logs/*.log

# Notification service logs
tail -f notification-service/logs/*.log
```

### 3. Kiểm tra WebSocket connections

Mở browser DevTools → Network → WS để xem WebSocket connections

## 🔄 Event Flow

1. **Product Creation Flow**:

   ```
   Frontend → Auth Service → RabbitMQ → Notification Service → Frontend
   ```

2. **Order Creation Flow**:

   ```
   Frontend → Order Service → RabbitMQ → Notification Service → Frontend
   ```

3. **Product Update Flow**:
   ```
   Auth Service → RabbitMQ → Order Service (update prices) + Notification Service → Frontend
   ```

## 📝 Event Data Structure

```javascript
{
  event: "PRODUCT_CREATED",
  data: {
    id: 1,
    name: "Product Name",
    price: 99.99
  },
  timestamp: "2024-01-01T00:00:00.000Z",
  service: "auth-product-user-service"
}
```

## 🛠️ Troubleshooting

### Lỗi kết nối RabbitMQ

```bash
# Kiểm tra RabbitMQ status
brew services list | grep rabbitmq

# Restart RabbitMQ
brew services restart rabbitmq
```

### Lỗi kết nối WebSocket

- Kiểm tra CORS settings
- Kiểm tra port conflicts
- Kiểm tra firewall settings

### Events không được nhận

- Kiểm tra exchange và queue names
- Kiểm tra RabbitMQ Management UI
- Kiểm tra service logs

## 📚 Tài liệu tham khảo

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
