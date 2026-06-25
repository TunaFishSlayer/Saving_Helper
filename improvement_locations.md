# Danh sách Vị trí Cần Bổ sung / Cập nhật trong Báo cáo GR1

Tài liệu này chỉ rõ từng cải tiến cần được viết vào **phần/chương nào** trong báo cáo gốc.

---

## Cấu trúc Báo cáo Gốc (để tham chiếu)

```
MỞ ĐẦU
CHƯƠNG I.   GIỚI THIỆU BÀI TOÁN
  1.1  Bối cảnh
  1.2  Mục tiêu
  1.3  Phạm vi
CHƯƠNG II.  THIẾT KẾ HỆ THỐNG
  2.1  Biểu đồ Usecase tổng quát
  2.2  Quy trình nghiệp vụ
  2.3  Đặc tả chức năng
  2.4  Thiết kế cơ sở dữ liệu
CHƯƠNG III. CÔNG NGHỆ SỬ DỤNG
CHƯƠNG IV.  KẾT QUẢ
  4.1  Chức năng đã hoàn thành
  4.2  Các phần còn hạn chế  ← (cần xóa/sửa các mục đã giải quyết)
  4.3  Hướng phát triển      ← (cần xóa/sửa các mục đã triển khai)
KẾT LUẬN
TÀI LIỆU THAM KHẢO
```

---

## Danh sách Chi tiết

### 1. Chuyển đổi Database: MongoDB → SQLite + Prisma

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương III** — Công nghệ sử dụng | Thay thế mục "Database: MongoDB với Mongoose ODM" bằng "Database: SQLite với Prisma ORM". Mô tả lý do chuyển đổi: không cần server riêng, dễ di chuyển, type-safe queries. |
| **Chương II, mục 2.4** — Thiết kế CSDL | Cập nhật sơ đồ ERD để phản ánh schema Prisma mới, bổ sung hai bảng mới `Goal` và `Subscription`, thêm cột `clientUuid` trên tất cả bảng. |

---

### 2. Xuất dữ liệu Excel / CSV

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Thêm mục mới: "f) Xuất dữ liệu". Mô tả tính năng xuất file Excel (.xlsx) qua ExcelJS, fallback CSV phía client khi offline. |
| **Chương IV, mục 4.2** — Các phần còn hạn chế | **Xóa dòng** *"Chưa có export data (CSV, PDF)"* — hạn chế này đã được giải quyết. |

---

### 3. Hỗ trợ Đa tiền tệ (VND / USD)

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Thêm vào mục Dashboard hoặc tạo mục riêng "g) Đa tiền tệ". Mô tả CurrencyContext, bộ chuyển đổi VND/USD trên header, quy đổi động tỷ giá 25.400. |
| **Chương IV, mục 4.2** — Các phần còn hạn chế | **Xóa dòng** *"Chưa có multi-currency support"* — hạn chế này đã được giải quyết. |

---

### 4. Giao dịch Định kỳ (Subscriptions + Cron Scheduler)

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương I, mục 1.2** — Mục tiêu | Bổ sung mục tiêu: "Quản lý dịch vụ định kỳ: Theo dõi các khoản thanh toán tái tục (Netflix, Spotify...)" |
| **Chương II, mục 2.3** — Đặc tả chức năng | Thêm đặc tả usecase mới: "Đặc tả usecase tạo dịch vụ định kỳ (Subscription)" — gồm bảng trường dữ liệu đầu vào tương tự các usecase khác. |
| **Chương II, mục 2.4** — Thiết kế CSDL | Bổ sung bảng `Subscription` trong ERD. |
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Thêm mục: "h) Quản lý dịch vụ định kỳ". Mô tả subscription module và cron scheduler tự động ghi nhận giao dịch. |
| **Chương IV, mục 4.2** — Các phần còn hạn chế | **Xóa dòng** *"Chưa có recurring transactions"* — hạn chế này đã được giải quyết. |

---

### 5. AI Đọc Hóa đơn (OCR Microservice)

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương III** — Công nghệ sử dụng | Thêm mục mới "OCR Service": FastAPI (Python), PaddleOCR, VietOCR, Groq LLM API. Mô tả kiến trúc microservice độc lập. |
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Thêm vào mục quản lý giao dịch: "Quét hóa đơn bằng AI — chụp/upload ảnh, hệ thống tự động điền thông tin giao dịch". |
| **Chương IV, mục 4.3** — Hướng phát triển | **Xóa dòng** *"Áp dụng AI đọc hóa đơn để tự động nhập dữ liệu"* — tính năng này đã được triển khai. |

---

### 6. Mục tiêu Tích lũy (Goals Module)

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương I, mục 1.2** — Mục tiêu | Bổ sung mục tiêu: "Quản lý mục tiêu tích lũy: Thiết lập và theo dõi tiến độ tiết kiệm theo mục tiêu cụ thể." |
| **Chương II, mục 2.3** — Đặc tả chức năng | Thêm đặc tả usecase: "Đặc tả usecase tạo mục tiêu tích lũy (Goal)". |
| **Chương II, mục 2.4** — Thiết kế CSDL | Bổ sung bảng `Goal` trong ERD. |
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Thêm mục: "i) Quản lý mục tiêu tích lũy". Mô tả tạo mục tiêu, nạp tiền, progress bar, biểu đồ donut phân bổ. |

---

### 7. Dashboard Nâng cao (6 Biểu đồ)

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương IV, mục 4.1** — Mục e) Dashboard & Thống kê | Cập nhật và mở rộng mục này. Liệt kê đầy đủ 6 biểu đồ: AreaChart xu hướng thu-chi, AreaChart tỷ lệ tiết kiệm, PieChart danh mục, AreaChart chi tiêu hàng ngày, BarChart ngân sách vs thực tế, tổng quan số liệu. |
| **Chương IV, mục 4.3** — Hướng phát triển, mục c) UX/UI | **Xóa dòng** *"Thêm nhiều loại biểu đồ (bar, line charts)"* — đã triển khai. |

---

### 8. Ứng dụng Di động (Capacitor Android)

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương I, mục 1.3** — Phạm vi | Thêm: "Hỗ trợ cài đặt như ứng dụng Android native thông qua Capacitor WebView." |
| **Chương III** — Công nghệ sử dụng | Thêm mục "Mobile": Capacitor (`@capacitor/core`, `@capacitor/android`), mô tả cách đóng gói web app thành Android APK. |
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Thêm mục: "j) Ứng dụng Android". Mô tả bottom navigation, FAB, bottom sheet modals. |
| **Chương IV, mục 4.3** — Hướng phát triển, mục c) | **Xóa dòng** *"Ứng dụng di động (React Native)"* — đã triển khai theo hướng khác (Capacitor). |

---

### 9. Đa ngôn ngữ (Tiếng Việt / Tiếng Anh)

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương I, mục 1.3** — Phạm vi | Thêm: "Hỗ trợ giao diện song ngữ: Tiếng Việt và Tiếng Anh." |
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Thêm mục mới: "k) Đa ngôn ngữ". Mô tả LanguageContext, bộ chuyển đổi ngôn ngữ trên header, lưu trạng thái localStorage. |

---

### 10. Chế độ Offline-First (IndexedDB + Sync)

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương III** — Công nghệ sử dụng | Thêm mục "Offline Storage": Dexie.js (IndexedDB wrapper), mô tả sync queue và endpoint `/api/sync`. |
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Thêm mục: "l) Chế độ Offline". Mô tả lưu trữ cục bộ, đồng bộ tự động, hiển thị trạng thái Cloud Sync / Ngoại tuyến, người dùng Guest. |

---

### 11. Bảo mật & Nhập liệu Nâng cao

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương III** — Công nghệ sử dụng, mục Security | Cập nhật: Thêm "User enumeration prevention" vào danh sách biện pháp bảo mật. |
| **Chương IV, mục 4.1** — Chức năng đã hoàn thành | Bổ sung vào mục "Quản lý người dùng": Custom confirmation modals thay thế browser `confirm()`. Bổ sung vào mục giao dịch: FormattedAmountInput với IME compatibility. |

---

### 12. UX/UI Nâng cao

| Vị trí | Nội dung cần viết |
|---|---|
| **Chương IV, mục 4.1** — Mục e) Dashboard & Thống kê | Bổ sung mô tả giao diện: font Plus Jakarta Sans, micro-animations, glassmorphism bottom nav, page entrance animations, gradient charts. |
| **Chương IV, mục 4.3** — Hướng phát triển, mục c) UX/UI | **Xóa các dòng đã hoàn thành**: "Chế độ tối (Dark mode)", "Thêm nhiều loại biểu đồ". Giữ lại các mục chưa làm nếu có. |

---

## Tóm tắt — Các mục cần XÓA khỏi Chương IV.2 và IV.3

Những hạn chế và đề xuất trong báo cáo gốc đã được giải quyết, cần **xóa hoặc chuyển sang "Đã hoàn thành"**:

### Chương IV.2 — Các phần còn hạn chế (cần xóa):
- ~~Chưa có export data (CSV, PDF)~~ → **Đã có: Excel + CSV**
- ~~Chưa có multi-currency support~~ → **Đã có: VND/USD**
- ~~Chưa có recurring transactions~~ → **Đã có: Subscription module**

### Chương IV.3 — Hướng phát triển (cần xóa/chuyển):
- ~~Áp dụng AI đọc hóa đơn~~ → **Đã triển khai: OCR Microservice**
- ~~Thêm nhiều loại biểu đồ (bar, line charts)~~ → **Đã triển khai: 6 biểu đồ**
- ~~Ứng dụng di động (React Native)~~ → **Đã triển khai: Capacitor Android**
