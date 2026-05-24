# GoTix Backend API

RESTful API cho nền tảng marketplace mua bán vé GoTix.

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (upload ảnh)
- express-validator

## Cài đặt & Chạy

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài dependencies
npm install

# 3. Tạo file .env (đã có sẵn mẫu)
# Chỉnh sửa MONGO_URI nếu cần

# 4. Chạy development server
npm run dev

# 5. Chạy production server
npm start
```

Server mặc định chạy tại: `http://localhost:5000`

## Cấu hình .env

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/gotix
JWT_SECRET=gotix_super_secret_key_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/          # Kết nối MongoDB
│   ├── controllers/     # Xử lý logic
│   ├── middleware/      # Auth, role, error, upload
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── utils/           # generateToken, apiResponse
│   ├── validations/     # express-validator rules
│   ├── uploads/         # File ảnh upload
│   ├── app.js           # Express app setup
│   └── server.js        # Entry point
├── .env
└── package.json
```

## Response Format

Mọi response đều theo format thống nhất:

```json
// Thành công
{ "success": true, "message": "...", "data": { ... } }

// Thất bại
{ "success": false, "message": "...", "errors": [...] }
```

## Authentication

Gửi JWT token qua **Authorization header** hoặc **cookie**:

```
Authorization: Bearer <token>
```

---

## API Reference

### AUTH

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký | No |
| POST | `/api/auth/login` | Đăng nhập | No |
| POST | `/api/auth/logout` | Đăng xuất | No |
| GET | `/api/auth/me` | Xem thông tin cá nhân | Yes |
| PUT | `/api/auth/change-password` | Đổi mật khẩu | Yes |

**POST /api/auth/register**
```json
// Request
{ "name": "Nguyễn Văn A", "email": "a@gmail.com", "password": "123456", "phone": "0901234567" }

// Response 201
{ "success": true, "message": "Đăng ký thành công", "data": { "user": {...}, "token": "eyJ..." } }
```

**POST /api/auth/login**
```json
// Request
{ "email": "a@gmail.com", "password": "123456" }

// Response 200
{ "success": true, "message": "Đăng nhập thành công", "data": { "user": {...}, "token": "eyJ..." } }
```

---

### USERS

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/users/profile` | Xem profile của mình | Yes |
| PUT | `/api/users/profile` | Cập nhật profile | Yes |
| GET | `/api/users/seller/:id` | Xem profile seller | No |
| GET | `/api/users/:id/reviews` | Xem đánh giá của seller | No |

**PUT /api/users/profile** (multipart/form-data)
```
name: "Tên mới"
phone: "0901234567"
avatar: [file ảnh]
```

---

### TICKETS

| Method | Endpoint | Mô tả | Auth / Role |
|--------|----------|-------|------------|
| GET | `/api/tickets` | Danh sách vé (public) | Optional |
| GET | `/api/tickets/:id` | Chi tiết vé | No |
| POST | `/api/tickets` | Đăng vé mới | seller / admin |
| PUT | `/api/tickets/:id` | Sửa vé | Yes (owner/admin) |
| DELETE | `/api/tickets/:id` | Xóa vé | Yes (owner/admin) |
| PATCH | `/api/tickets/:id/status` | Thay đổi status | Yes (owner/admin) |
| PATCH | `/api/tickets/:id/verify` | Duyệt / từ chối vé | admin |

**GET /api/tickets** — Query params:
```
search=blackpink          # tìm theo tên
category=concert          # lọc loại vé: movie|concert|event|sport|workshop|bus|train
location=hà nội           # lọc địa điểm
minPrice=100000           # giá tối thiểu
maxPrice=500000           # giá tối đa
sort=priceAsc             # sắp xếp: newest|oldest|priceAsc|priceDesc|eventDate
page=1                    # trang
limit=12                  # số item mỗi trang
```

**POST /api/tickets** (multipart/form-data):
```
title: "Vé BLACKPINK World Tour"
category: concert
location: "Sân Mỹ Đình, Hà Nội"
description: "Vé khu VIP còn 2 tờ"
originalPrice: 3000000
resalePrice: 2500000
quantity: 2
eventDate: "2025-08-15"
eventTime: "19:00"
ticketImage: [file ảnh]
qrImage: [file ảnh]
details: {"artistName":"BLACKPINK","seatZone":"VIP A","gate":"Cổng 3"}
```

---

### TRANSACTIONS

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/transactions` | Tạo giao dịch | Yes |
| GET | `/api/transactions/my-purchases` | Lịch sử mua | Yes |
| GET | `/api/transactions/my-sales` | Lịch sử bán | Yes |
| GET | `/api/transactions/:id` | Chi tiết giao dịch | Yes (owner/admin) |
| PATCH | `/api/transactions/:id/payment` | Cập nhật thanh toán | Yes |
| PATCH | `/api/transactions/:id/cancel` | Hủy giao dịch | Yes (buyer) |

**POST /api/transactions**
```json
{
  "ticketId": "64abc...",
  "quantity": 1,
  "paymentMethod": "momo"
}
```

**PATCH /api/transactions/:id/payment**
```json
{ "paymentStatus": "paid" }
```
> Khi `paymentStatus = "paid"`, hệ thống tự động:
> - Chuyển `transactionStatus` → `completed`
> - Giảm `quantity` của vé
> - Nếu `quantity = 0` → chuyển vé thành `sold`

---

### CHATS

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/chats` | Gửi tin nhắn | Yes |
| GET | `/api/chats/conversations` | Danh sách hội thoại | Yes |
| GET | `/api/chats/:userId` | Tin nhắn với 1 user | Yes |
| PATCH | `/api/chats/:id/read` | Đánh dấu đã đọc | Yes |

**POST /api/chats**
```json
{ "receiverId": "64abc...", "ticketId": "64def...", "message": "Vé còn không bạn?" }
```

---

### REVIEWS

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/reviews` | Tạo đánh giá | Yes (buyer) |
| GET | `/api/reviews/seller/:sellerId` | Đánh giá của seller | No |

**POST /api/reviews**
```json
{
  "sellerId": "64abc...",
  "ticketId": "64def...",
  "transactionId": "64ghi...",
  "rating": 5,
  "comment": "Seller uy tín, vé thật!"
}
```
> Chỉ buyer có giao dịch `completed` với seller mới được đánh giá.

---

### REPORTS

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/reports` | Báo cáo vé | Yes |
| GET | `/api/reports/my-reports` | Xem báo cáo của mình | Yes |

**POST /api/reports**
```json
{ "ticketId": "64abc...", "reason": "Nghi ngờ vé giả", "description": "QR code không hợp lệ" }
```

---

### ADMIN (yêu cầu role = admin)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/dashboard` | Thống kê tổng quan |
| GET | `/api/admin/users` | Danh sách người dùng |
| PATCH | `/api/admin/users/:id/status` | Khóa / mở tài khoản |
| GET | `/api/admin/tickets/pending` | Vé chờ duyệt |
| PATCH | `/api/admin/tickets/:id/verify` | Duyệt / từ chối vé |
| GET | `/api/admin/reports` | Danh sách báo cáo |
| PATCH | `/api/admin/reports/:id/resolve` | Xử lý báo cáo |
| GET | `/api/admin/transactions` | Danh sách giao dịch |

**GET /api/admin/dashboard** — Response:
```json
{
  "success": true,
  "message": "Dashboard",
  "data": {
    "totalUsers": 120,
    "totalTickets": 350,
    "totalTransactions": 88,
    "pendingTickets": 5,
    "pendingReports": 3,
    "totalRevenue": 45000000,
    "completedTransactions": 70
  }
}
```

**PATCH /api/admin/users/:id/status**
```json
{ "isActive": false }
```

**PATCH /api/admin/tickets/:id/verify**
```json
{ "verifyStatus": "verified" }
// hoặc
{ "verifyStatus": "rejected" }
```

**PATCH /api/admin/reports/:id/resolve**
```json
{ "status": "resolved" }
// hoặc
{ "status": "rejected" }
```

---

## Kết nối với Frontend ReactJS

Thêm vào frontend (ví dụ trong `src/api/client.js`):

```javascript
const API_BASE = 'http://localhost:5000/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });
  return res.json();
}
```

> **Frontend hiện tại** dùng mock data (`src/data/mockData.js`). Để kết nối thật:
> 1. Thay thế các function trong `TicketContext` và `AuthContext` bằng `fetch` / `axios` gọi đến API trên.
> 2. Lưu JWT token từ response login vào `localStorage`.
> 3. Gửi token qua header `Authorization: Bearer <token>` ở mọi request cần auth.

## Business Rules

- Vé mới đăng có `verifyStatus = pending` — ẩn khỏi danh sách công khai cho đến khi admin duyệt.
- Chỉ `seller` và `admin` được đăng vé.
- Buyer không thể mua vé của chính mình.
- Khi thanh toán thành công (`paymentStatus = paid`): quantity giảm, nếu về 0 thì status = `sold`.
- Seller chỉ sửa/xóa vé của mình nếu vé chưa bán.
- Buyer chỉ đánh giá seller sau khi giao dịch `completed`.
- Mỗi giao dịch chỉ được đánh giá 1 lần.
