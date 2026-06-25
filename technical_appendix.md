# Phụ lục Kỹ thuật — Savings Helper (Phiên bản Cải tiến)

Tài liệu này bổ sung các nội dung kỹ thuật chi tiết vào báo cáo gốc, bao gồm:
1. Bảng Đặc tả API
2. Yêu cầu Phi chức năng
3. Chiến lược Kiểm thử
4. Bảng Tổng kết Use Case
5. Bảng Thuật ngữ
6. Tài liệu Tham khảo Cập nhật

---

# 1. Bảng Đặc tả REST API

Base URL: `http://localhost:5000/api`
Xác thực: `Authorization: Bearer <JWT token>` (trừ các endpoint công khai)

## 1.1 System

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/health` | Kiểm tra trạng thái hoạt động của server | ❌ |
| GET | `/` | Thông tin API và liên kết tài liệu | ❌ |
| GET | `/api-docs` | Tài liệu Swagger/OpenAPI tương tác | ❌ |

## 1.2 Authentication (`/api/auth`)

| Method | Endpoint | Mô tả | Request Body | Auth |
|--------|----------|-------|--------------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới | `{email, password, name}` | ❌ |
| POST | `/api/auth/login` | Đăng nhập bằng email/password | `{email, password}` | ❌ |
| POST | `/api/auth/google` | Đăng nhập bằng Google OAuth | `{credential}` | ❌ |
| POST | `/api/auth/request-reset-password` | Yêu cầu mã OTP đặt lại mật khẩu | `{email}` | ❌ |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu bằng mã OTP | `{email, code, newPassword}` | ❌ |

> Ghi chú bảo mật: Endpoint `request-reset-password` luôn trả về phản hồi thành công bất kể email có tồn tại hay không, nhằm ngăn chặn tấn công liệt kê người dùng (user enumeration).

## 1.3 Người dùng (`/api/users`)

| Method | Endpoint | Mô tả | Request Body | Auth |
|--------|----------|-------|--------------|------|
| GET | `/api/users/me` | Lấy thông tin hồ sơ hiện tại | — | ✅ |
| PUT | `/api/users/me/update` | Cập nhật tên hiển thị | `{name}` | ✅ |
| PUT | `/api/users/me/updatePassword` | Đổi mật khẩu | `{oldPassword, newPassword}` | ✅ |
| DELETE | `/api/users/me` | Xóa tài khoản và toàn bộ dữ liệu | — | ✅ |

## 1.4 Danh mục (`/api/categories`)

| Method | Endpoint | Mô tả | Request Body | Auth |
|--------|----------|-------|--------------|------|
| GET | `/api/categories` | Lấy danh sách tất cả danh mục | — | ✅ |
| POST | `/api/categories` | Tạo danh mục mới | `{name, type, description?}` | ✅ |
| PUT | `/api/categories/:id` | Cập nhật danh mục | `{name?, type?, description?}` | ✅ |
| DELETE | `/api/categories/:id` | Xóa danh mục | — | ✅ |
| POST | `/api/categories/init-defaults` | Khởi tạo danh mục mặc định cho người dùng mới | — | ✅ |

## 1.5 Giao dịch (`/api/transactions`)

| Method | Endpoint | Mô tả | Tham số / Body | Auth |
|--------|----------|-------|----------------|------|
| GET | `/api/transactions` | Lấy danh sách giao dịch (có phân trang & lọc) | `?page, limit, type, categoryId, startDate, endDate, sortBy, order` | ✅ |
| POST | `/api/transactions` | Tạo giao dịch mới | `{amount, type, categoryId, description?, date}` | ✅ |
| GET | `/api/transactions/:id` | Lấy giao dịch theo ID | — | ✅ |
| PUT | `/api/transactions/:id` | Cập nhật giao dịch | `{amount?, type?, categoryId?, description?, date?}` | ✅ |
| DELETE | `/api/transactions/:id` | Xóa giao dịch | — | ✅ |
| GET | `/api/transactions/summary/total` | Tổng thu hoặc tổng chi | `?type=income\|expense` | ✅ |
| GET | `/api/transactions/summary/monthly` | Tóm tắt giao dịch theo tháng | `?year, month` | ✅ |
| GET | `/api/transactions/summary/category` | Chi tiêu phân nhóm theo danh mục | — | ✅ |
| GET/POST | `/api/transactions/export` | Xuất file Excel (.xlsx) | Body (POST): `{transactions[], startDate?, endDate?}` | ✅ |
| POST | `/api/transactions/scan-receipt` | Phân tích ảnh hóa đơn bằng AI OCR | `multipart/form-data: receipt (image)` | ✅ |

## 1.6 Ngân sách (`/api/budgets`)

| Method | Endpoint | Mô tả | Request Body | Auth |
|--------|----------|-------|--------------|------|
| GET | `/api/budgets` | Lấy danh sách ngân sách | — | ✅ |
| POST | `/api/budgets` | Tạo ngân sách mới | `{categoryId, amount, period, startDate, endDate?, alertThreshold?}` | ✅ |
| PUT | `/api/budgets/:id` | Cập nhật ngân sách | `{amount?, period?, alertThreshold?, isActive?}` | ✅ |
| DELETE | `/api/budgets/:id` | Xóa ngân sách | — | ✅ |

## 1.7 Mục tiêu Tích lũy (`/api/goals`)

| Method | Endpoint | Mô tả | Request Body | Auth |
|--------|----------|-------|--------------|------|
| GET | `/api/goals` | Lấy danh sách mục tiêu | — | ✅ |
| POST | `/api/goals` | Tạo mục tiêu mới | `{name, targetAmount, deadline?}` | ✅ |
| PUT | `/api/goals/:id/add-funds` | Nạp tiền vào mục tiêu | `{amount}` | ✅ |
| DELETE | `/api/goals/:id` | Xóa mục tiêu | — | ✅ |

## 1.8 Dịch vụ Định kỳ (`/api/subscriptions`)

| Method | Endpoint | Mô tả | Request Body | Auth |
|--------|----------|-------|--------------|------|
| GET | `/api/subscriptions` | Lấy danh sách dịch vụ | — | ✅ |
| POST | `/api/subscriptions` | Thêm dịch vụ định kỳ mới | `{name, amount, billingCycle, nextBillingDate, categoryId}` | ✅ |
| PUT | `/api/subscriptions/:id/toggle` | Bật/tắt trạng thái hoạt động | — | ✅ |
| DELETE | `/api/subscriptions/:id` | Hủy và xóa dịch vụ | — | ✅ |

## 1.9 Đồng bộ Dữ liệu (`/api/sync`)

| Method | Endpoint | Mô tả | Request Body | Auth |
|--------|----------|-------|--------------|------|
| GET | `/api/sync/pull` | Kéo toàn bộ dữ liệu từ server về client | — | ✅ |
| POST | `/api/sync` | Đẩy batch mutations từ Sync Queue lên server | `{creates[], updates[], deletes[]}` | ✅ |

## 1.10 OCR Microservice (FastAPI — cổng 8000)

| Method | Endpoint | Mô tả | Request Body | Auth |
|--------|----------|-------|--------------|------|
| POST | `/scan` | Nhận ảnh hóa đơn, trả về JSON giao dịch | `multipart/form-data: file (image)` | Header: `X-Device-UUID` |
| GET | `/health` | Kiểm tra trạng thái OCR service | — | ❌ |

---

# 2. Yêu cầu Phi chức năng (Non-Functional Requirements)

## 2.1 Hiệu năng (Performance)

| Yêu cầu | Mục tiêu |
|---------|----------|
| Thời gian phản hồi API thông thường | < 500ms |
| Thời gian phản hồi API phức tạp (export, analytics) | < 3 giây |
| Thời gian tải trang đầu tiên (First Load) | < 2 giây |
| Thời gian phân tích hóa đơn AI (OCR + LLM) | < 15 giây |
| Đồng bộ dữ liệu offline (sync queue) | < 5 giây cho ≤ 100 bản ghi |

## 2.2 Bảo mật (Security)

| Biện pháp | Chi tiết triển khai |
|-----------|---------------------|
| Xác thực | JWT (JSON Web Token), thời hạn 7 ngày |
| Mã hóa mật khẩu | bcryptjs, salt rounds = 10 |
| Giới hạn tốc độ (Rate Limiting) | `express-rate-limit`: Auth routes: 10 req/15 phút; API routes: 100 req/15 phút |
| Bảo vệ liệt kê người dùng | Endpoint reset mật khẩu trả về phản hồi đồng nhất bất kể email tồn tại |
| Theo dõi thiết bị ẩn danh | Header `X-Device-UUID` để phân biệt rate-limit giữa Guest users |
| Xác thực đầu vào | Joi validation middleware cho tất cả request body |
| CORS | Cấu hình origin whitelist |

## 2.3 Tính khả dụng (Availability)

| Yêu cầu | Mô tả |
|---------|-------|
| Hoạt động offline | Toàn bộ chức năng đọc/ghi hoạt động khi không có mạng thông qua IndexedDB |
| Đồng bộ tự động | Sync Queue tự động đẩy khi kết nối mạng được khôi phục |
| Graceful degradation | OCR service không khả dụng → fallback sang nhập tay; Backend không khả dụng → fallback sang CSV export cục bộ |

## 2.4 Khả năng Bảo trì (Maintainability)

| Yêu cầu | Mô tả |
|---------|-------|
| Kiến trúc phân tầng | Presentation / API / Service / Data — mỗi tầng độc lập, dễ thay thế |
| ORM type-safe | Prisma cung cấp auto-generated types, tránh SQL injection và lỗi runtime |
| Tài liệu API | Swagger/OpenAPI tích hợp tại `/api-docs` |
| Logging | Winston logger ghi nhật ký request/response và lỗi |

## 2.5 Khả năng Mở rộng (Scalability)

| Yêu cầu | Ghi chú |
|---------|---------|
| SQLite phù hợp cho | Ứng dụng cá nhân, tải thấp đến trung bình, không cần nhiều kết nối đồng thời |
| Hướng nâng cấp | Migration sang PostgreSQL bằng cách thay `provider` trong `schema.prisma` và chạy lại migrations — không cần thay đổi code service layer |
| OCR Microservice | Tách biệt hoàn toàn, có thể scale độc lập hoặc thay thế bằng service khác |

## 2.6 Tính Tương thích (Compatibility)

| Yêu cầu | Mô tả |
|---------|-------|
| Trình duyệt web | Chrome, Edge, Firefox (phiên bản hiện đại) |
| Ứng dụng Android | Android 8.0 (API level 26) trở lên thông qua Capacitor WebView |
| Responsive design | Desktop (≥1024px), Tablet (768–1023px), Mobile (<768px), Tiny (<480px) |

---

# 4. Bảng Tổng kết Use Case

| Mã UC | Tên Use Case | Tác nhân | Tiền điều kiện | Hậu điều kiện |
|-------|-------------|---------|----------------|----------------|
| UC01 | Đăng ký tài khoản | Khách | Chưa có tài khoản | Tài khoản được tạo, người dùng đăng nhập |
| UC02 | Đăng nhập Email/Password | Khách | Tài khoản tồn tại | JWT token được cấp, session bắt đầu |
| UC03 | Đăng nhập Google SSO | Khách | Có tài khoản Google | JWT token được cấp thông qua OAuth |
| UC04 | Quên mật khẩu | Khách | Tài khoản tồn tại | Mật khẩu được đặt lại bằng mã OTP qua email |
| UC05 | Cập nhật hồ sơ | Người dùng | Đã đăng nhập | Tên hiển thị được cập nhật |
| UC06 | Đổi mật khẩu | Người dùng (local) | Đã đăng nhập, tài khoản local | Mật khẩu mới được lưu |
| UC07 | Xóa tài khoản | Người dùng | Đã đăng nhập | Tài khoản và toàn bộ dữ liệu bị xóa vĩnh viễn |
| UC08 | Tạo danh mục | Người dùng | Đã đăng nhập | Danh mục mới được thêm vào hệ thống |
| UC09 | Sửa/Xóa danh mục | Người dùng | Danh mục tồn tại | Danh mục được cập nhật hoặc xóa |
| UC10 | Thêm giao dịch thủ công | Người dùng | Có ít nhất 1 danh mục | Giao dịch được lưu vào DB |
| UC11 | Quét hóa đơn bằng AI | Người dùng / Khách | Có ảnh hóa đơn | Form giao dịch được tự động điền từ OCR |
| UC12 | Lọc & Xem giao dịch | Người dùng | Có giao dịch | Danh sách giao dịch được lọc theo tiêu chí |
| UC13 | Xuất Excel / CSV | Người dùng | Có giao dịch | File Excel/CSV được tải xuống |
| UC14 | Tạo ngân sách | Người dùng | Có danh mục | Ngân sách mới được tạo cho danh mục |
| UC15 | Theo dõi ngân sách | Người dùng | Có ngân sách và giao dịch | Hiển thị progress bar và cảnh báo |
| UC16 | Tạo mục tiêu tích lũy | Người dùng | Đã đăng nhập | Mục tiêu được tạo với currentAmount = 0 |
| UC17 | Nạp tiền vào mục tiêu | Người dùng | Mục tiêu tồn tại | currentAmount được tăng, tiến độ cập nhật |
| UC18 | Thêm dịch vụ định kỳ | Người dùng | Đã đăng nhập | Subscription được lưu, cron scheduler theo dõi |
| UC19 | Hủy dịch vụ định kỳ | Người dùng | Dịch vụ đang hoạt động | Dịch vụ bị xóa khỏi lịch thanh toán |
| UC20 | Xem Dashboard & Biểu đồ | Người dùng | Có dữ liệu giao dịch | Các biểu đồ hiển thị dữ liệu tài chính |
| UC21 | Sử dụng chế độ Offline | Khách / Người dùng | Không có kết nối mạng | Dữ liệu được đọc/ghi vào IndexedDB |
| UC22 | Đồng bộ dữ liệu lên Cloud | Người dùng | Có dữ liệu chờ trong Sync Queue | Dữ liệu được đẩy lên server và queue bị xóa |
| UC23 | Chuyển đổi ngôn ngữ | Người dùng / Khách | Đang sử dụng ứng dụng | Toàn bộ UI chuyển sang ngôn ngữ được chọn |
| UC24 | Chuyển đổi tiền tệ | Người dùng / Khách | Đang sử dụng ứng dụng | Tất cả số tiền được quy đổi và hiển thị theo tỷ giá |
| UC25 | Tự động ghi giao dịch (Cron) | Hệ thống | Server đang chạy, có subscription đến hạn | Giao dịch chi tiêu được tạo tự động |
Tóm lại: Giữ bảng tổng kết 25 UC, chỉ cần viết thêm 5 đặc tả chi tiết cho UC11, UC16, UC18, UC21, UC22 là đủ để báo cáo vừa đầy đủ vừa không dư thừa.
---

# 5. Bảng Thuật ngữ (Glossary)

| Thuật ngữ | Giải thích |
|-----------|-----------|
| **API** (Application Programming Interface) | Giao diện lập trình ứng dụng — tập hợp các endpoint cho phép client và server giao tiếp |
| **bcrypt** | Thuật toán mã hóa mật khẩu một chiều, sử dụng salt và nhiều vòng hash để tăng độ bảo mật |
| **Cron Job** | Tác vụ được lập lịch chạy tự động theo khoảng thời gian định kỳ (ví dụ: mỗi ngày lúc 00:00) |
| **CRUD** | Create, Read, Update, Delete — bốn thao tác cơ bản trên dữ liệu |
| **DBML** (Database Markup Language) | Ngôn ngữ mô tả schema database dạng văn bản, dùng với công cụ dbdiagram.io |
| **Dexie.js** | Thư viện JavaScript bọc IndexedDB, cung cấp API dễ sử dụng cho lưu trữ cục bộ trên trình duyệt |
| **ERD** (Entity Relationship Diagram) | Sơ đồ mô tả các thực thể (bảng) trong cơ sở dữ liệu và quan hệ giữa chúng |
| **FastAPI** | Framework Python hiệu năng cao để xây dựng REST API, tự động tạo tài liệu Swagger |
| **FAB** (Floating Action Button) | Nút hành động nổi trên giao diện mobile, thường dùng để kích hoạt thao tác chính |
| **Glassmorphism** | Phong cách thiết kế UI sử dụng hiệu ứng kính mờ (backdrop blur, nền bán trong suốt) |
| **Groq API** | API của Groq cung cấp truy cập vào các mô hình ngôn ngữ lớn (LLM) với tốc độ suy luận cao |
| **IME** (Input Method Editor) | Phần mềm bộ gõ cho phép nhập ký tự đặc biệt — ví dụ Unikey (Telex/VNI) cho tiếng Việt |
| **IndexedDB** | Cơ sở dữ liệu NoSQL tích hợp trong trình duyệt, cho phép lưu trữ dữ liệu offline phía client |
| **JWT** (JSON Web Token) | Chuỗi token mã hóa dùng để xác thực người dùng, chứa payload và chữ ký số |
| **LLM** (Large Language Model) | Mô hình ngôn ngữ lớn được huấn luyện trên lượng dữ liệu khổng lồ, dùng để phân tích ngữ nghĩa |
| **Micro-animation** | Hiệu ứng chuyển động nhỏ trong UI (hover, scale, fade) nhằm tăng tính tương tác và trải nghiệm |
| **OAuth** | Giao thức ủy quyền mở cho phép đăng nhập bằng tài khoản bên thứ ba (Google, Facebook...) |
| **OCR** (Optical Character Recognition) | Công nghệ nhận dạng ký tự quang học — trích xuất văn bản từ hình ảnh |
| **ORM** (Object Relational Mapping) | Lớp trừu tượng giúp tương tác với cơ sở dữ liệu thông qua đối tượng code thay vì SQL thuần |
| **PaddleOCR** | Thư viện OCR mã nguồn mở của Baidu, hỗ trợ nhận dạng văn bản đa ngôn ngữ |
| **Prisma** | ORM hiện đại cho Node.js, cung cấp type-safe queries và công cụ migration database |
| **Rate Limiting** | Giới hạn số lượng request một client có thể gửi trong một khoảng thời gian nhất định |
| **REST** (Representational State Transfer) | Kiến trúc thiết kế API sử dụng HTTP methods (GET, POST, PUT, DELETE) |
| **SQLite** | Hệ quản trị cơ sở dữ liệu quan hệ gọn nhẹ, lưu trữ toàn bộ dữ liệu trong một file duy nhất |
| **SSO** (Single Sign-On) | Cơ chế đăng nhập một lần có thể truy cập nhiều dịch vụ — ở đây là Google OAuth |
| **Sync Queue** | Hàng đợi lưu trữ các thao tác chưa đồng bộ khi offline, sẽ được xử lý khi có kết nối mạng |
| **UML** (Unified Modeling Language) | Ngôn ngữ mô hình hóa thống nhất dùng để vẽ sơ đồ phần mềm (Use Case, Activity, Sequence...) |
| **VietOCR** | Thư viện OCR chuyên biệt cho văn bản tiếng Việt với độ chính xác cao hơn PaddleOCR thuần |
| **WebView** | Component trình duyệt nhúng trong ứng dụng native (Android/iOS), dùng bởi Capacitor |
| **Capacitor** | Framework mã nguồn mở của Ionic cho phép đóng gói ứng dụng web thành ứng dụng native Android/iOS |

---

# 6. Tài liệu Tham khảo Cập nhật

## Tài liệu gốc (giữ nguyên)
- [1] Martin Fowler — *Catalog of Patterns of Enterprise Application Architecture*
- [2] Laws of UX — https://lawsofux.com
- [3] REST API Tutorial — https://restfulapi.net
- [4] Express.js Guide — https://expressjs.com/en/guide

## Bổ sung cho phiên bản cải tiến
- [5] Prisma Documentation — https://www.prisma.io/docs
- [6] SQLite Documentation — https://www.sqlite.org/docs.html
- [7] Capacitor Documentation — https://capacitorjs.com/docs
- [8] Dexie.js Documentation — https://dexie.org/docs
- [9] FastAPI Documentation — https://fastapi.tiangolo.com
- [10] PaddleOCR GitHub — https://github.com/PaddlePaddle/PaddleOCR
- [11] Groq API Documentation — https://console.groq.com/docs
- [12] React Documentation — https://react.dev
- [13] Vite Documentation — https://vitejs.dev/guide
- [14] PlantUML Documentation — https://plantuml.com/guide
- [15] dbdiagram.io — https://dbdiagram.io
- [16] JSON Web Tokens (JWT) — https://jwt.io/introduction
- [17] ExcelJS — https://github.com/exceljs/exceljs
- [18] Recharts — https://recharts.org/en-US


