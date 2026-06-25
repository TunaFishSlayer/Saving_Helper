# Phụ lục: Cải tiến và Phát triển Hệ thống Savings Helper

Tài liệu này ghi nhận các cải tiến đáng kể đã được thực hiện so với phiên bản được mô tả trong Báo cáo GR1 ban đầu. Mỗi phần được đối chiếu trực tiếp với các hạn chế và hướng phát triển đã nêu trong báo cáo gốc.

---

## 1. Cơ sở Dữ liệu — Chuyển đổi từ MongoDB sang SQLite/Prisma

### Báo cáo gốc mô tả:
- Database: **MongoDB** với **Mongoose ODM**
- Deployed trên **Render**

### Cải tiến thực hiện:
- Chuyển đổi toàn bộ sang **SQLite** (file `backend/prisma/dev.db`) thông qua **Prisma ORM**, loại bỏ sự phụ thuộc vào máy chủ database bên ngoài.
- Prisma cung cấp type-safe queries, migration tự động và schema rõ ràng.
- Lược đồ cơ sở dữ liệu bổ sung thêm các bảng mới không có trong phiên bản gốc: `Goal` (Mục tiêu tích lũy) và `Subscription` (Dịch vụ định kỳ).
- Thêm cột `clientUuid` vào tất cả các bảng để hỗ trợ đồng bộ offline.

---

## 2. Xuất dữ liệu — Giải quyết hạn chế "Chưa có export data"

### Báo cáo gốc ghi nhận hạn chế:
> *"Chưa có export data (CSV, PDF)"*

### Cải tiến thực hiện:
- Triển khai **xuất file Excel** (định dạng `.xlsx`) thông qua thư viện **ExcelJS** ở backend (`POST /api/transactions/export`).
- Client gửi dữ liệu giao dịch trong body request, cho phép người dùng Guest/Offline cũng xuất được dữ liệu từ IndexedDB cục bộ.
- Khi backend không khả dụng, hệ thống tự động **fallback sang xuất CSV** phía client.
- Dữ liệu được định dạng chuẩn ngày `dd/mm/yy`, bao gồm đầy đủ thông tin: ngày, mô tả, danh mục, loại, số tiền.

---

## 3. Hỗ trợ Đa tiền tệ — Giải quyết hạn chế "Chưa có multi-currency support"

### Báo cáo gốc ghi nhận hạn chế:
> *"Chưa có multi-currency support"*

### Cải tiến thực hiện:
- Tích hợp **CurrencyContext** hỗ trợ hai chế độ hiển thị: **VND (₫)** và **USD ($)**.
- Tỷ giá quy đổi cố định: `1 USD = 25,400 VND`, áp dụng tại thời điểm hiển thị.
- Bộ chọn tiền tệ được tích hợp vào header, lưu trạng thái qua `localStorage`.
- Tất cả các màn hình tài chính (Dashboard, Giao dịch, Ngân sách, Dịch vụ định kỳ, Mục tiêu) đều cập nhật động theo tiền tệ được chọn.
- **FormattedAmountInput** hiển thị giá trị quy đổi hai chiều theo thời gian thực khi người dùng nhập liệu (ví dụ: nhập `$50` → hiển thị `≈ 1.270.000 ₫`).

---

## 4. Giao dịch định kỳ — Giải quyết hạn chế "Chưa có recurring transactions"

### Báo cáo gốc ghi nhận hạn chế:
> *"Chưa có recurring transactions"*

### Cải tiến thực hiện:
- Xây dựng module **Quản lý Dịch vụ Định kỳ** (Subscriptions) hoàn chỉnh:
  - Người dùng có thể thêm các dịch vụ tái tục (Netflix, Spotify, v.v.) với chu kỳ thanh toán: hàng tuần, hàng tháng, hàng năm.
  - **Cron scheduler** (`subscriptionScheduler.js`) chạy nền tự động ghi nhận giao dịch chi tiêu khi đến ngày thanh toán và cập nhật `nextBillingDate`.
  - Người dùng có thể hủy dịch vụ qua modal xác nhận tùy chỉnh.

---

## 5. AI Đọc Hóa đơn — Tính năng mới được đề xuất và thực hiện

### Báo cáo gốc đề xuất hướng phát triển:
> *"Áp dụng AI đọc hóa đơn để tự động nhập dữ liệu"*

### Cải tiến thực hiện:
- Xây dựng **OCR Microservice** độc lập bằng **FastAPI** (Python), tích hợp:
  - **PaddleOCR** và **VietOCR** để nhận dạng văn bản từ hình ảnh hóa đơn.
  - **Groq API** (LLM) để phân tích và trích xuất thông tin giao dịch có cấu trúc.
- Người dùng chụp/tải ảnh hóa đơn → hệ thống tự động điền số tiền, mô tả, danh mục vào form giao dịch.
- Tích hợp nút "AI đọc giao dịch" trên màn hình Giao dịch, kèm trạng thái loading và thông báo kết quả.

---

## 6. Mục tiêu Tích lũy — Tính năng mới hoàn toàn

### Báo cáo gốc: Không có tính năng này.

### Cải tiến thực hiện:
- Module **Mục tiêu Tích lũy** (Goals) cho phép người dùng:
  - Tạo mục tiêu tiết kiệm với tên, số tiền mục tiêu và hạn chót tùy chọn.
  - Nạp tiền vào mục tiêu theo từng đợt.
  - Theo dõi tiến độ qua thanh progress bar động.
  - Xem phân bổ danh mục mục tiêu qua **biểu đồ Donut (PieChart)**.

---

## 7. Dashboard Nâng cao — Mở rộng từ biểu đồ tròn đơn giản

### Báo cáo gốc mô tả:
> *"Biểu đồ tròn chi tiêu theo danh mục, danh sách giao dịch gần đây, cảnh báo ngân sách"*
> *Đề xuất: "Thêm nhiều loại biểu đồ (bar, line charts)"*

### Cải tiến thực hiện:
- Thêm **6 loại biểu đồ** trên Dashboard:
  1. **AreaChart** xu hướng Thu - Chi theo tháng (income/expense trend).
  2. **AreaChart** tỷ lệ tiết kiệm ròng (net savings rate).
  3. **PieChart** chi tiêu theo danh mục (giữ lại từ bản gốc).
  4. **AreaChart** chi tiêu hàng ngày trong tháng hiện tại (daily spending timeline).
  5. **BarChart** so sánh Ngân sách vs Chi tiêu thực tế (budget vs actual).
  6. Tóm tắt số liệu tổng quan: tổng thu, tổng chi, số dư, tỷ lệ tiết kiệm.
- Biểu đồ hỗ trợ **bộ lọc thời gian**: tháng trước, 3 tháng, 6 tháng, năm trước.
- Tất cả biểu đồ cập nhật động theo tiền tệ (VND/USD).

---

## 8. Ứng dụng Di động — Giải quyết đề xuất "Mobile app"

### Báo cáo gốc đề xuất:
> *"Ứng dụng di động (React Native)"*

### Cải tiến thực hiện:
- Thay vì xây dựng lại bằng React Native, ứng dụng được đóng gói thành **Android app** sử dụng **Capacitor**:
  - Toàn bộ giao diện web React/Vite được nhúng vào WebView trên Android.
  - Hỗ trợ cài đặt như ứng dụng native trên Android.
  - Tối ưu giao diện **mobile-first** với bottom navigation bar (BottomNavbar), Floating Action Button (FAB), và bottom sheet modals.
  - Responsive trên tất cả kích thước màn hình: mobile (<768px), tiny (<480px), desktop.

---

## 9. UX/UI Nâng cao — Giải quyết đề xuất "Dark mode, Customizable themes"

### Báo cáo gốc đề xuất:
> *"Chế độ tối (Dark mode), Tùy chỉnh giao diện (Customizable themes)"*

### Cải tiến thực hiện:
- Nâng cấp font chữ toàn bộ sang **Plus Jakarta Sans** (Google Fonts).
- Thêm **micro-animations**: card lift on hover, icon scale/rotate, sidebar link slide.
- Giao diện glassmorphism cho bottom navigation bar.
- **Biểu đồ gradient** màu sắc phong phú (rose, indigo, emerald).
- Mọi modal chuyển thành **bottom sheet** trên mobile.
- Thêm page entrance route animations (`fadeInUp`).

---

## 10. Đa ngôn ngữ — Tính năng mới hoàn toàn

### Báo cáo gốc: Không có hỗ trợ đa ngôn ngữ.

### Cải tiến thực hiện:
- Xây dựng **LanguageContext** với hệ thống dịch thuật đầy đủ:
  - Hỗ trợ hai ngôn ngữ: **Tiếng Việt** và **Tiếng Anh**.
  - Bộ chuyển đổi ngôn ngữ tích hợp trong header, hiển thị `VN/EN` trên mobile và `Tiếng Việt/English` trên desktop.
  - Toàn bộ UI được dịch động: navigation, form labels, buttons, messages, biểu đồ, modals.
  - Trạng thái ngôn ngữ được lưu trữ qua `localStorage`.

---

## 11. Chế độ Offline-First — Tính năng mới hoàn toàn

### Báo cáo gốc: Không có hỗ trợ offline.

### Cải tiến thực hiện:
- Tích hợp **IndexedDB** (thư viện Dexie) để lưu trữ dữ liệu cục bộ phía client.
- **Sync queue** tự động đồng bộ các thay đổi offline lên server khi có kết nối mạng trở lại.
- API endpoint `/api/sync` xử lý merge/overwrite dữ liệu khi người dùng đăng nhập sau khi sử dụng offline.
- Hiển thị trạng thái kết nối rõ ràng: "Cloud Sync" / "Offline Mode" (Đồng bộ đám mây / Ngoại tuyến) trên header.
- Người dùng Guest cũng có thể sử dụng đầy đủ tính năng và đồng bộ dữ liệu sau khi đăng ký.

---

## 12. Bảo mật & Nhập liệu Nâng cao

### Cải tiến thực hiện (so với báo cáo gốc):
- **User enumeration prevention**: Endpoint đặt lại mật khẩu trả về phản hồi đồng nhất bất kể email có tồn tại hay không, ngăn chặn tấn công liệt kê người dùng.
- **FormattedAmountInput**: Component nhập liệu tiền tệ tùy chỉnh, tương thích IME Vietnamese (Telex/VNI), hiển thị số tiền định dạng dot-separated theo thời gian thực.
- **Custom confirmation modals**: Thay thế hoàn toàn các hộp thoại `confirm()` của trình duyệt bằng modal overlay tùy chỉnh, nhất quán về thiết kế trên tất cả các trang (Giao dịch, Ngân sách, Danh mục, Mục tiêu, Hồ sơ).
- **Anonymous device tracking**: Header `X-Device-UUID` cho phép người dùng Guest sử dụng dịch vụ OCR với rate-limit riêng.

---

## Tổng kết So sánh

| Hạng mục | Phiên bản Gốc (GR1) | Phiên bản Cải tiến |
|---|---|---|
| Database | MongoDB (cloud) | SQLite + Prisma (local file) |
| Export dữ liệu | ❌ Chưa có | ✅ Excel (.xlsx) + CSV fallback |
| Đa tiền tệ | ❌ Chưa có | ✅ VND / USD (quy đổi động) |
| Giao dịch định kỳ | ❌ Chưa có | ✅ Subscription module + cron scheduler |
| AI đọc hóa đơn | 💡 Đề xuất | ✅ OCR Microservice (FastAPI + Groq) |
| Mục tiêu tích lũy | ❌ Chưa có | ✅ Goals module với donut chart |
| Dashboard | Cơ bản (1 biểu đồ) | ✅ 6 loại biểu đồ tương tác |
| Ứng dụng di động | 💡 Đề xuất React Native | ✅ Android app via Capacitor |
| Đa ngôn ngữ | ❌ Chưa có | ✅ Tiếng Việt / Tiếng Anh |
| Chế độ Offline | ❌ Chưa có | ✅ IndexedDB + Sync queue |
| Bộ lọc biểu đồ | ❌ Chưa có | ✅ 4 khoảng thời gian |
| Custom modals | ❌ Browser `confirm()` | ✅ Styled modal overlays |
| Mobile-responsive | Cơ bản | ✅ Bottom nav, FAB, bottom sheets |
