# GoTix — User Flow & Business Flow Document

> **Phiên bản:** 1.0  
> **Ngày:** 2026-05-27  
> **Loại tài liệu:** Business / Product / UX Flow  
> **Mục tiêu sử dụng:** Dùng để vẽ User Flow, Activity Diagram, UX Flow

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Phân vai người dùng](#2-phân-vai-người-dùng)
3. [Flow: Đăng ký & Đăng nhập](#3-flow-đăng-ký--đăng-nhập)
4. [Flow: Khám phá & Tìm kiếm vé](#4-flow-khám-phá--tìm-kiếm-vé)
5. [Flow: Xem chi tiết vé](#5-flow-xem-chi-tiết-vé)
6. [Flow: Mua vé & Thanh toán](#6-flow-mua-vé--thanh-toán)
7. [Flow: Đăng bán vé](#7-flow-đăng-bán-vé)
8. [Flow: Nhắn tin với người bán](#8-flow-nhắn-tin-với-người-bán)
9. [Flow: Đánh giá người bán](#9-flow-đánh-giá-người-bán)
10. [Flow: Lưu vé yêu thích](#10-flow-lưu-vé-yêu-thích)
11. [Flow: Ví & Nạp tiền](#11-flow-ví--nạp-tiền)
12. [Flow: Rút tiền](#12-flow-rút-tiền)
13. [Flow: Nâng cấp Pro](#13-flow-nâng-cấp-pro)
14. [Flow: Báo cáo vi phạm](#14-flow-báo-cáo-vi-phạm)
15. [Flow: Quản lý tài khoản cá nhân](#15-flow-quản-lý-tài-khoản-cá-nhân)
16. [Flow: Dashboard người dùng](#16-flow-dashboard-người-dùng)
17. [Flow: Admin — Duyệt vé](#17-flow-admin--duyệt-vé)
18. [Flow: Admin — Quản lý người dùng](#18-flow-admin--quản-lý-người-dùng)
19. [Flow: Admin — Duyệt yêu cầu rút tiền](#19-flow-admin--duyệt-yêu-cầu-rút-tiền)
20. [Flow: Admin — Xử lý báo cáo vi phạm](#20-flow-admin--xử-lý-báo-cáo-vi-phạm)
21. [Flow: Admin — Xác nhận nạp tiền](#21-flow-admin--xác-nhận-nạp-tiền)
22. [Flow: AI ChatBot hỗ trợ](#22-flow-ai-chatbot-hỗ-trợ)
23. [Bảng tóm tắt trạng thái vé](#23-bảng-tóm-tắt-trạng-thái-vé)
24. [Bảng tóm tắt trạng thái giao dịch](#24-bảng-tóm-tắt-trạng-thái-giao-dịch)

---

## 1. Tổng quan hệ thống

**GoTix** là nền tảng marketplace cho phép cá nhân mua bán lại các loại vé sự kiện. Người bán có thể đăng tin rao vé thừa, người mua tìm và mua trực tiếp trong hệ thống, mọi giao dịch được trung gian và bảo vệ bởi GoTix.

### Các loại vé được hỗ trợ

| Loại vé | Mô tả |
|---|---|
| Vé phim | Vé chiếu phim tại rạp |
| Vé concert | Vé buổi diễn âm nhạc |
| Vé sự kiện | Triển lãm, hội nghị, lễ hội |
| Vé thể thao | Các trận đấu thể thao |
| Vé workshop | Khóa học, hội thảo ngắn |
| Vé xe khách | Vé di chuyển bằng xe khách |

### Nguyên tắc hoạt động

- **Mọi vé đăng bán đều phải được Admin duyệt** trước khi hiển thị công khai.
- **GoTix thu phí nền tảng 2%** trên mỗi giao dịch thành công.
- **Tiền bán vé** được cộng vào ví của người bán sau khi giao dịch hoàn tất.
- **Người mua thanh toán** qua ví nội bộ GoTix hoặc các cổng thanh toán được tích hợp.
- **Hệ thống Trust Score** đánh giá độ uy tín của người bán dựa trên lịch sử giao dịch và đánh giá từ người mua.

---

## 2. Phân vai người dùng

### 2.1 Guest (Khách chưa đăng nhập)

Là người dùng truy cập GoTix mà chưa có tài khoản hoặc chưa đăng nhập.

**Được phép:**
- Xem trang chủ, danh sách vé, chi tiết từng vé
- Tìm kiếm và lọc vé theo nhiều tiêu chí
- Xem hồ sơ công khai của người bán
- Đăng ký tài khoản mới
- Đăng nhập vào tài khoản có sẵn

**Không được phép:**
- Mua vé
- Đăng bán vé
- Nhắn tin với người bán
- Lưu vé yêu thích
- Truy cập bất kỳ tính năng nào cần xác thực

> Khi Guest cố truy cập tính năng cần đăng nhập, hệ thống điều hướng tự động đến trang đăng nhập và ghi nhớ trang muốn vào để quay lại sau khi đăng nhập thành công.

---

### 2.2 User (Người dùng đã đăng nhập)

Là tài khoản đã xác minh, có thể vừa mua vừa bán vé trên GoTix.

**Được phép:**
- Tất cả quyền của Guest
- Mua vé từ người bán khác
- Đăng bán vé (chờ Admin duyệt)
- Nhắn tin với người bán / người mua
- Đánh giá người bán sau giao dịch
- Lưu vé yêu thích
- Quản lý ví GoTix (nạp tiền, rút tiền)
- Xem lịch sử giao dịch
- Chỉnh sửa hồ sơ cá nhân
- Báo cáo vé vi phạm
- Nâng cấp tài khoản lên Pro

---

### 2.3 Pro User (Người dùng Pro)

Là User đã trả phí đăng ký gói Pro. Có toàn bộ quyền của User, cộng thêm:

**Đặc quyền bổ sung:**
- Tin đăng được ưu tiên hiển thị lên đầu danh sách tìm kiếm
- Huy hiệu "Pro" hiển thị trên tất cả tin đăng và hồ sơ
- Tăng độ tin cậy với người mua

---

### 2.4 Admin (Quản trị viên)

Tài khoản nội bộ GoTix, có quyền kiểm soát toàn bộ hệ thống.

**Trách nhiệm:**
- Duyệt hoặc từ chối tin đăng vé mới
- Quản lý tài khoản người dùng
- Xem toàn bộ giao dịch và doanh thu nền tảng
- Xử lý báo cáo vi phạm
- Duyệt yêu cầu rút tiền của người bán
- Xác nhận giao dịch nạp tiền
- Xem nhật ký hoạt động hệ thống

---

## 3. Flow: Đăng ký & Đăng nhập

### 3.1 Đăng ký tài khoản mới

**Điều kiện đầu vào:** Người dùng là Guest, chưa có tài khoản.

```
[1] Guest vào trang chủ → Nhấn "Đăng ký"
[2] Hệ thống hiển thị form đăng ký
[3] Guest điền thông tin:
      - Họ và tên
      - Địa chỉ email
      - Số điện thoại
      - Mật khẩu (tối thiểu 6 ký tự)
      - Xác nhận mật khẩu
[4] Guest nhấn "Tạo tài khoản"
```

**Kết quả thành công:**
- Hệ thống tạo tài khoản mới
- Người dùng được đăng nhập tự động
- Điều hướng về trang chủ (hoặc trang đang cố truy cập trước đó)
- Hiển thị thông báo chào mừng

**Kết quả thất bại — các trường hợp:**

| Lỗi | Phản hồi hệ thống |
|---|---|
| Email đã được đăng ký | Thông báo "Email này đã tồn tại, hãy đăng nhập" |
| Mật khẩu không khớp | Highlight ô xác nhận, yêu cầu nhập lại |
| Thiếu trường bắt buộc | Highlight từng trường bị bỏ trống |
| Email không đúng định dạng | Thông báo lỗi ngay tại trường email |

---

### 3.2 Đăng nhập

**Điều kiện đầu vào:** Người dùng có tài khoản GoTix.

```
[1] Guest nhấn "Đăng nhập" (header hoặc từ redirect)
[2] Hệ thống hiển thị form đăng nhập
[3] Nhập email và mật khẩu
[4] Nhấn "Đăng nhập"
```

**Kết quả thành công — phân nhánh theo vai:**
- **Admin** → Điều hướng đến trang Admin Dashboard (`/admin`)
- **User thường** → Quay lại trang đang cố truy cập, hoặc về trang chủ

**Kết quả thất bại:**

| Lỗi | Phản hồi hệ thống |
|---|---|
| Sai email hoặc mật khẩu | "Email hoặc mật khẩu không đúng" |
| Tài khoản bị khóa | "Tài khoản của bạn đã bị vô hiệu hóa" |
| Bỏ trống trường | Highlight trường còn thiếu |

---

### 3.3 Đăng xuất

```
[1] User nhấn vào avatar/tên trên thanh điều hướng
[2] Chọn "Đăng xuất" từ dropdown menu
[3] Hệ thống xóa phiên đăng nhập
[4] Người dùng trở về trạng thái Guest, ở lại trang hiện tại
```

---

## 4. Flow: Khám phá & Tìm kiếm vé

### 4.1 Trang chủ — Điểm khởi đầu khám phá

```
[1] Người dùng (Guest hoặc User) vào trang chủ
[2] Hệ thống hiển thị:
      - Banner tìm kiếm nổi bật ở trên cùng
      - Các danh mục vé (Phim / Concert / Sự kiện / Thể thao / Workshop / Xe khách)
      - Vé nổi bật / được xem nhiều
      - Hướng dẫn cách hoạt động của GoTix
```

**Hành động người dùng từ trang chủ:**
- Nhập từ khóa vào ô tìm kiếm → vào danh sách vé đã lọc
- Nhấn vào một danh mục → vào danh sách vé theo danh mục đó
- Nhấn vào một vé nổi bật → vào trang chi tiết vé

---

### 4.2 Trang danh sách vé — Lọc & Tìm kiếm

```
[1] Người dùng vào trang danh sách vé (/tickets)
[2] Hệ thống hiển thị toàn bộ vé đang hoạt động và đã được duyệt
[3] Người dùng có thể áp dụng bộ lọc:
```

**Bộ lọc có sẵn:**

| Bộ lọc | Tùy chọn |
|---|---|
| Từ khóa | Tìm theo tên vé, mô tả |
| Danh mục | Phim, Concert, Sự kiện, Thể thao, Workshop, Xe khách |
| Địa điểm | Theo tên thành phố / địa điểm |
| Khoảng giá | Giá tối thiểu — Giá tối đa |
| Ngày sự kiện | Từ ngày — Đến ngày |
| Sắp xếp | Mới nhất / Cũ nhất / Giá tăng dần / Giá giảm dần / Ngày sự kiện / Pro trước |

```
[4] Danh sách tự động cập nhật theo bộ lọc được chọn
[5] Mỗi thẻ vé hiển thị: ảnh, tên sự kiện, địa điểm, giá, ngày, huy hiệu Pro (nếu có)
[6] Người dùng nhấn vào thẻ vé → vào trang chi tiết
```

---

## 5. Flow: Xem chi tiết vé

```
[1] Người dùng nhấn vào một thẻ vé bất kỳ
[2] Hệ thống hiển thị trang chi tiết vé
```

**Thông tin hiển thị trên trang chi tiết:**
- Ảnh vé (có thể xem nhiều ảnh)
- Tên sự kiện, danh mục, địa điểm, ngày giờ
- Mô tả chi tiết từ người bán
- Giá bán lại, số lượng còn lại
- Thông tin ghế ngồi (nếu có)
- Thẻ QR (nếu người bán đã đính kèm)
- Lượt xem

**Khối thông tin người bán:**
- Tên và avatar người bán
- Trust Score và huy hiệu uy tín (Cao / Trung bình / Cần lưu ý)
- Số lượt bán thành công
- Điểm đánh giá trung bình
- Link xem hồ sơ đầy đủ

**Khối đánh giá:**
- Danh sách các đánh giá từ những người đã mua từ người bán này
- Hiển thị: avatar, tên người mua, số sao, nội dung nhận xét, ngày đánh giá

**Hành động người dùng tại trang này:**

| Hành động | Guest | User |
|---|---|---|
| Xem ảnh vé | ✅ | ✅ |
| Xem thông tin người bán | ✅ | ✅ |
| Xem đánh giá | ✅ | ✅ |
| Lưu vé yêu thích | ❌ → Yêu cầu đăng nhập | ✅ |
| Nhắn tin với người bán | ❌ → Yêu cầu đăng nhập | ✅ |
| Mua vé | ❌ → Yêu cầu đăng nhập | ✅ |
| Báo cáo vé | ❌ → Yêu cầu đăng nhập | ✅ |

> **Lưu ý nghiệp vụ:** Người dùng không thể mua vé do chính mình đăng bán.

---

## 6. Flow: Mua vé & Thanh toán

**Điều kiện đầu vào:** User đã đăng nhập, vé đang trong trạng thái đang bán.

### Bước 1 — Khởi tạo đơn hàng

```
[1] User ở trang chi tiết vé → Nhấn "Mua ngay"
[2] Hệ thống kiểm tra điều kiện:
      - User có phải chính người đăng bán không? → Nếu có: Báo lỗi, dừng
      - Vé có còn hàng không? → Nếu hết: Báo lỗi, dừng
[3] Hệ thống điều hướng đến trang thanh toán
```

### Bước 2 — Xác nhận đơn hàng

```
[4] Trang thanh toán (Bước 1/3): Xác nhận đơn hàng
      - Hiển thị tóm tắt: tên vé, số lượng, đơn giá
      - Hiển thị phí nền tảng (2%)
      - Hiển thị tổng tiền phải thanh toán
[5] User nhấn "Tiếp tục"
```

### Bước 3 — Chọn phương thức thanh toán

```
[6] Trang thanh toán (Bước 2/3): Chọn phương thức
      - Ví GoTix (nếu đủ số dư)
      - Chuyển khoản ngân hàng
      - Ví Momo
      - VNPay
[7] User chọn phương thức và nhấn "Thanh toán"
```

**Phân nhánh theo phương thức:**

- **Ví GoTix:** Hệ thống trừ tiền ngay lập tức, chuyển sang Bước 4
- **VNPay / Momo:** Hệ thống chuyển hướng sang cổng thanh toán bên thứ ba → User hoàn tất thanh toán bên đó → Cổng thanh toán redirect về GoTix kèm kết quả
- **Chuyển khoản ngân hàng:** Hệ thống hiển thị thông tin tài khoản và mã giao dịch → User chuyển khoản → Admin xác nhận thủ công

### Bước 4 — Xác nhận kết quả

```
[8] Trang kết quả thanh toán (Bước 3/3)
```

**Kịch bản thành công:**
- Hệ thống ghi nhận giao dịch thành công
- Trạng thái vé chuyển thành "Đã bán"
- Tiền bán (trừ phí 2%) được cộng vào ví người bán
- Cả hai bên nhận thông báo (người bán: có đơn hàng mới, người mua: mua thành công)
- Hiển thị trang thành công với tóm tắt đơn hàng
- Người mua có thể vào Dashboard để xem lại đơn đã mua

**Kịch bản thất bại:**
- Thanh toán qua cổng thứ ba bị từ chối hoặc hủy
- Hiển thị trang thất bại với lý do
- Giao dịch không được ghi nhận
- Vé vẫn còn trong trạng thái đang bán
- Người mua được phép thử lại

---

## 7. Flow: Đăng bán vé

**Điều kiện đầu vào:** User đã đăng nhập.

### Bước 1 — Bắt đầu đăng tin

```
[1] User vào Dashboard → Nhấn "Đăng vé mới" (hoặc từ header)
[2] Hệ thống hiển thị form đăng vé
```

### Bước 2 — Điền thông tin vé

```
[3] User điền thông tin:
      Thông tin cơ bản:
        - Tiêu đề tin đăng
        - Danh mục vé (Phim / Concert / Sự kiện / Thể thao / Workshop / Xe khách)
        - Mô tả chi tiết

      Thông tin sự kiện:
        - Địa điểm tổ chức
        - Ngày và giờ diễn ra sự kiện
        - Thông tin ghế / hàng / khu vực (nếu có)

      Thông tin bán:
        - Giá gốc của vé (để hiển thị tham khảo)
        - Giá bán lại (do người bán đặt)
        - Số lượng vé muốn bán

      Tài liệu đính kèm:
        - Ảnh vé (tối đa nhiều ảnh)
        - Mã QR của vé (nếu có)

[4] User xem lại và nhấn "Đăng vé"
```

### Bước 3 — Vé chờ duyệt

```
[5] Hệ thống tiếp nhận tin đăng, gán trạng thái "Chờ duyệt"
[6] Thông báo cho User: "Vé đã được gửi đi, đang chờ Admin duyệt"
[7] Tin đăng xuất hiện trong Dashboard của User với nhãn "Đang chờ duyệt"
[8] Tin đăng CHƯA hiển thị công khai cho người dùng khác
```

### Bước 4 — Admin duyệt

```
[9] Admin xem xét và ra quyết định:
      - Duyệt → Vé được đăng công khai (xem Flow 17)
      - Từ chối → Vé bị từ chối kèm lý do (xem Flow 17)
```

**Kết quả sau khi được duyệt:**
- Vé xuất hiện trong danh sách công khai
- User (người bán) nhận thông báo "Vé của bạn đã được duyệt"
- Người dùng khác có thể tìm thấy và mua vé này

**Kết quả sau khi bị từ chối:**
- User nhận thông báo kèm lý do từ chối
- Vé hiển thị trạng thái "Bị từ chối" trong Dashboard
- User có thể chỉnh sửa và gửi lại

---

### 7.1 Quản lý tin đăng của bản thân

User có thể thực hiện các thao tác sau với vé đã đăng:

| Hành động | Điều kiện | Kết quả |
|---|---|---|
| Chỉnh sửa vé | Vé chưa có đơn mua | Cập nhật thông tin, vé quay về "Chờ duyệt" |
| Đánh dấu đã bán ngoài | Vé đang hiển thị | Trạng thái chuyển "Đã bán", ẩn khỏi danh sách |
| Xóa tin đăng | Vé chưa có đơn mua | Xóa hoàn toàn khỏi hệ thống |

---

## 8. Flow: Nhắn tin với người bán

**Điều kiện đầu vào:** User đã đăng nhập, đang xem trang chi tiết một vé không phải của mình.

```
[1] User nhấn "Nhắn tin cho người bán" tại trang chi tiết vé
[2] Hệ thống kiểm tra có cuộc trò chuyện nào về vé này giữa hai người chưa
      - Nếu chưa có: Tạo cuộc trò chuyện mới
      - Nếu đã có: Mở lại cuộc trò chuyện cũ
[3] Điều hướng đến trang Chat, mở sẵn cuộc trò chuyện với người bán
[4] Tin nhắn đầu tiên thường được gợi ý tự động theo ngữ cảnh vé
```

**Trải nghiệm trong phòng chat:**
```
[5] User gõ tin nhắn → Nhấn "Gửi"
[6] Tin nhắn hiển thị ngay phía bên phải (bong bóng xanh)
[7] Người bán nhận tin nhắn theo thời gian thực
[8] Nếu người bán đang online: Hiển thị "Đang nhập..." khi người bán đang soạn trả lời
[9] Nếu người bán offline: Tin nhắn lưu lại, người bán thấy khi quay online
```

**Trang danh sách hội thoại:**
```
[1] User vào mục "Tin nhắn" trong menu
[2] Hệ thống hiển thị danh sách tất cả hội thoại
      - Xếp theo thứ tự: Tin nhắn mới nhất ở trên
      - Hiển thị: avatar đối phương, tên, đoạn tin cuối, thời gian
      - Hội thoại có tin chưa đọc được highlight và hiển thị số lượng
[3] User chọn một hội thoại → Mở phòng chat tương ứng
[4] Tin nhắn chưa đọc tự động được đánh dấu đã đọc khi User mở hội thoại
```

---

## 9. Flow: Đánh giá người bán

**Điều kiện đầu vào:** User đã hoàn thành một giao dịch mua vé thành công.

```
[1] Sau khi giao dịch hoàn tất, User vào Dashboard → Mục "Vé đã mua"
[2] Giao dịch thành công hiển thị nút "Viết đánh giá"
[3] User nhấn vào nút đó
[4] Form đánh giá xuất hiện:
      - Chọn số sao (1 đến 5 sao)
      - Viết nhận xét (tùy chọn, có giới hạn ký tự)
[5] User nhấn "Gửi đánh giá"
```

**Kết quả:**
- Đánh giá xuất hiện trên trang hồ sơ công khai của người bán
- Trust Score của người bán được tính toán lại
- Nút "Viết đánh giá" của giao dịch đó biến mất (mỗi giao dịch chỉ đánh giá 1 lần)
- Người bán nhận thông báo có đánh giá mới

**Kịch bản thất bại:**
- User cố đánh giá người bán mà mình chưa từng mua → Hệ thống từ chối

---

## 10. Flow: Lưu vé yêu thích

**Điều kiện đầu vào:** User đã đăng nhập.

```
[1] User xem danh sách vé hoặc chi tiết vé
[2] Nhấn icon trái tim trên thẻ vé hoặc trang chi tiết
[3] Hệ thống lưu vé vào danh sách yêu thích
[4] Icon trái tim chuyển sang màu đỏ (đã lưu)
[5] Nhấn lại → Bỏ lưu, icon trở về trạng thái rỗng
```

**Trang Vé đã lưu:**
```
[1] User vào Dashboard → Mục "Vé đã lưu"
[2] Hệ thống hiển thị danh sách tất cả vé đã bookmark
[3] Mỗi thẻ vé hiển thị trạng thái hiện tại (còn bán / đã bán / đã hết hạn)
[4] User có thể:
      - Nhấn vào vé để xem chi tiết
      - Nhấn icon xóa để bỏ lưu
```

> **Lưu ý:** Nếu một vé đã lưu bị người bán xóa hoặc bị Admin ẩn, vé đó vẫn hiện trong danh sách với trạng thái "Không còn hoạt động".

---

## 11. Flow: Ví & Nạp tiền

### 11.1 Xem ví

```
[1] User vào Dashboard → Mục "Ví của tôi"
[2] Hệ thống hiển thị:
      - Số dư hiện tại
      - Lịch sử giao dịch ví (nạp vào / rút ra / nhận tiền bán / thanh toán mua)
      - Các nút hành động: "Nạp tiền" / "Rút tiền"
```

---

### 11.2 Nạp tiền vào ví

```
[1] User nhấn "Nạp tiền"
[2] Nhập số tiền muốn nạp
[3] Hệ thống hiển thị thông tin chuyển khoản:
      - QR code VietQR
      - Số tài khoản ngân hàng GoTix
      - Số tiền cần chuyển
      - Mã giao dịch duy nhất (để Admin đối soát)
[4] User mở app ngân hàng, quét QR và chuyển khoản
[5] User quay lại GoTix, nhấn xác nhận "Tôi đã chuyển khoản"
[6] Yêu cầu nạp tiền chuyển sang trạng thái "Chờ xác nhận"
[7] Admin xem xét và xác nhận giao dịch (xem Flow 21)
```

**Kết quả sau khi Admin xác nhận:**
- Số dư ví được cộng thêm số tiền đã nạp
- User nhận thông báo "Nạp tiền thành công"
- Giao dịch xuất hiện trong lịch sử ví

---

## 12. Flow: Rút tiền

**Điều kiện đầu vào:** User có số dư ví đủ để rút, đã cung cấp thông tin ngân hàng.

```
[1] User vào Ví → Nhấn "Rút tiền"
[2] Điền thông tin:
      - Số tiền muốn rút (tối thiểu theo quy định)
      - Ngân hàng thụ hưởng
      - Số tài khoản ngân hàng
      - Tên chủ tài khoản
[3] Xác nhận và nhấn "Gửi yêu cầu rút tiền"
[4] Hệ thống khóa số tiền tương ứng trong ví (không thể dùng số tiền này cho đến khi xử lý xong)
[5] Yêu cầu chuyển sang trạng thái "Đang xử lý"
[6] Admin xem xét và xử lý (xem Flow 19)
```

**Sau khi Admin duyệt:**
- Tiền được chuyển đến tài khoản ngân hàng của User
- Số dư ví trừ đi số tiền đã rút
- User nhận thông báo "Yêu cầu rút tiền thành công"

**Sau khi Admin từ chối:**
- Số tiền bị khóa được hoàn trả vào ví
- User nhận thông báo kèm lý do từ chối
- User có thể tạo yêu cầu rút tiền mới

---

## 13. Flow: Nâng cấp Pro

**Điều kiện đầu vào:** User đang dùng tài khoản thường, muốn tăng độ hiển thị cho tin đăng.

```
[1] User vào trang "Nâng cấp Pro" (từ menu hoặc từ Dashboard)
[2] Hệ thống hiển thị bảng so sánh gói:
      - Gói 1 tháng
      - Gói 3 tháng (có thể có ưu đãi)
      - Gói 6 tháng
      - Gói 1 năm (tiết kiệm nhất)
[3] Mỗi gói hiển thị: giá, thời hạn, danh sách quyền lợi
[4] User chọn gói → Nhấn "Đăng ký ngay"
[5] Hệ thống chuyển hướng sang cổng VNPay
[6] User hoàn tất thanh toán trên VNPay
[7] VNPay redirect về GoTix kèm kết quả
```

**Kết quả thành công:**
- Tài khoản được kích hoạt trạng thái Pro ngay lập tức
- Huy hiệu Pro xuất hiện trên tất cả tin đăng và hồ sơ
- Tất cả tin đăng đang hoạt động được ưu tiên hiển thị
- Hiển thị trang xác nhận với ngày hết hạn Pro

**Kết quả thất bại / Hủy:**
- Không thay đổi trạng thái tài khoản
- Hiển thị trang thông báo thất bại
- User có thể thử lại

> **Khi hết hạn Pro:** Tài khoản tự động trở về trạng thái thường. Tin đăng không bị xóa, chỉ mất ưu tiên hiển thị và huy hiệu Pro.

---

## 14. Flow: Báo cáo vi phạm

**Điều kiện đầu vào:** User đã đăng nhập, phát hiện vé có dấu hiệu gian lận.

```
[1] User ở trang chi tiết vé → Nhấn "Báo cáo vé này"
[2] Hệ thống hiển thị form báo cáo
[3] User chọn lý do:
      - Vé giả / không hợp lệ
      - Mã QR không hoạt động
      - Người bán không phản hồi
      - Thông tin vé sai sự thật
      - Vấn đề về giao dịch
      - Lý do khác
[4] User có thể bổ sung mô tả chi tiết
[5] Nhấn "Gửi báo cáo"
[6] Hệ thống xác nhận đã tiếp nhận báo cáo
[7] Tin đăng vé vẫn hiển thị bình thường trong lúc đang xem xét
[8] Admin nhận được báo cáo để xử lý (xem Flow 20)
```

---

## 15. Flow: Quản lý tài khoản cá nhân

### 15.1 Chỉnh sửa hồ sơ

```
[1] User nhấn vào avatar trên header → Chọn "Hồ sơ của tôi"
[2] Trang hồ sơ hiển thị thông tin hiện tại
[3] Nhấn "Chỉnh sửa"
[4] Có thể thay đổi:
      - Ảnh đại diện (upload ảnh mới)
      - Họ và tên
      - Số điện thoại
      - Địa chỉ / mô tả ngắn
[5] Nhấn "Lưu thay đổi"
[6] Hệ thống cập nhật và hiển thị thông tin mới
```

### 15.2 Đổi mật khẩu

```
[1] Vào Hồ sơ → Mục "Bảo mật" → Nhấn "Đổi mật khẩu"
[2] Nhập mật khẩu hiện tại
[3] Nhập mật khẩu mới (tối thiểu 6 ký tự)
[4] Xác nhận mật khẩu mới
[5] Nhấn "Cập nhật mật khẩu"
```

**Kết quả thành công:** Mật khẩu được cập nhật, phiên đăng nhập giữ nguyên.

**Kết quả thất bại:**

| Lỗi | Phản hồi |
|---|---|
| Mật khẩu hiện tại sai | "Mật khẩu hiện tại không đúng" |
| Mật khẩu mới không khớp | Highlight ô xác nhận |
| Mật khẩu quá ngắn | Thông báo yêu cầu tối thiểu |

---

### 15.3 Xem hồ sơ công khai của người bán

```
[1] Người dùng (Guest hoặc User) nhấn vào tên người bán
[2] Trang hồ sơ công khai hiển thị:
      - Thông tin cơ bản: tên, avatar, ngày tham gia
      - Trust Score và huy hiệu uy tín
      - Thống kê: tổng số vé đã bán, điểm đánh giá
      - Huy hiệu Pro (nếu có)
      - Danh sách tất cả vé đang bán của người này
      - Các đánh giá từ người mua
```

---

## 16. Flow: Dashboard người dùng

**Điều kiện đầu vào:** User đã đăng nhập, truy cập Dashboard cá nhân.

```
[1] User vào Dashboard (/dashboard)
[2] Hệ thống hiển thị tổng quan:
      - Số vé đang rao bán
      - Số vé đã bán thành công
      - Số vé đã mua
      - Số dư ví hiện tại
```

**Các mục trong Dashboard:**

| Mục | Nội dung |
|---|---|
| Tổng quan | Thống kê nhanh, hoạt động gần đây |
| Vé đang bán | Danh sách vé đã đăng (bao gồm cả chờ duyệt / đang bán / đã bán) |
| Vé đã mua | Lịch sử các vé đã mua thành công |
| Đánh giá | Đánh giá đã nhận được (với tư cách người bán) |
| Ví của tôi | Số dư, lịch sử giao dịch tài chính |
| Vé đã lưu | Danh sách vé bookmark |
| Lịch sử giao dịch | Tổng hợp tất cả giao dịch mua và bán |

---

## 17. Flow: Admin — Duyệt vé

**Điều kiện đầu vào:** Có tin đăng vé mới từ người dùng đang chờ duyệt.

```
[1] Admin vào Admin Dashboard → Mục "Quản lý vé"
[2] Hệ thống hiển thị danh sách tất cả vé theo trạng thái
[3] Admin lọc theo "Chờ duyệt" để xem các vé cần xem xét
[4] Admin nhấn vào một vé để xem chi tiết:
      - Tất cả thông tin người bán nhập
      - Ảnh đính kèm
      - Mã QR (nếu có)
      - Thông tin tài khoản người bán
[5] Admin ra quyết định:
```

**Duyệt vé:**
```
→ Nhấn "Duyệt"
→ Hệ thống chuyển trạng thái vé thành "Đang bán"
→ Vé xuất hiện công khai trong danh sách
→ Người bán nhận thông báo "Vé của bạn đã được duyệt"
```

**Từ chối vé:**
```
→ Nhấn "Từ chối"
→ Hệ thống yêu cầu Admin nhập lý do từ chối
→ Trạng thái vé chuyển thành "Bị từ chối"
→ Vé không hiển thị công khai
→ Người bán nhận thông báo kèm lý do từ chối
```

---

## 18. Flow: Admin — Quản lý người dùng

```
[1] Admin vào Admin Dashboard → Mục "Quản lý người dùng"
[2] Hệ thống hiển thị danh sách toàn bộ tài khoản
[3] Admin có thể tìm kiếm theo tên, email
[4] Admin có thể xem chi tiết từng tài khoản:
      - Thông tin cá nhân
      - Lịch sử hoạt động (số vé đã đăng, số giao dịch)
      - Trạng thái tài khoản
      - Điểm Trust Score
[5] Admin có thể thực hiện:
```

| Hành động | Kết quả |
|---|---|
| Xem hồ sơ chi tiết | Xem toàn bộ thông tin và lịch sử |
| Vô hiệu hóa tài khoản | User không thể đăng nhập, toàn bộ tin đăng bị ẩn |
| Kích hoạt lại tài khoản | Khôi phục quyền truy cập bình thường |

---

## 19. Flow: Admin — Duyệt yêu cầu rút tiền

```
[1] Admin vào Admin Dashboard → Mục "Yêu cầu rút tiền"
[2] Hệ thống hiển thị danh sách yêu cầu đang chờ xử lý
[3] Admin xem chi tiết từng yêu cầu:
      - Thông tin người yêu cầu
      - Số tiền muốn rút
      - Thông tin ngân hàng thụ hưởng
      - Số dư ví hiện tại của User
      - Thời gian tạo yêu cầu
[4] Admin thực hiện chuyển tiền thực tế qua hệ thống ngân hàng (ngoài hệ thống GoTix)
[5] Sau khi chuyển khoản xong, Admin nhấn "Xác nhận đã chuyển"
[6] Hệ thống trừ số dư ví và ghi nhận giao dịch
[7] User nhận thông báo "Yêu cầu rút tiền đã được xử lý"
```

**Trường hợp từ chối:**
```
→ Admin nhấn "Từ chối" kèm lý do
→ Số tiền bị khóa được hoàn trả vào ví User
→ User nhận thông báo từ chối kèm lý do
```

---

## 20. Flow: Admin — Xử lý báo cáo vi phạm

```
[1] Admin vào Admin Dashboard → Mục "Báo cáo vi phạm"
[2] Hệ thống hiển thị danh sách tất cả báo cáo
[3] Admin xem chi tiết báo cáo:
      - Người báo cáo
      - Vé bị báo cáo
      - Lý do và mô tả
      - Thời gian báo cáo
[4] Admin xem xét vé bị báo cáo
[5] Admin ra quyết định:
```

| Hành động | Kết quả |
|---|---|
| Ẩn vé (xác nhận vi phạm) | Vé bị gỡ khỏi danh sách công khai, người bán được thông báo |
| Bỏ qua (không có vi phạm) | Vé vẫn hiển thị bình thường, báo cáo được đóng |
| Cảnh báo người bán | Gửi thông báo cảnh cáo đến người bán |
| Khóa tài khoản người bán | Tài khoản bị vô hiệu hóa (trường hợp nghiêm trọng) |

```
[6] Admin cập nhật trạng thái báo cáo (Đã xử lý)
[7] Người báo cáo nhận thông báo về kết quả xử lý
```

---

## 21. Flow: Admin — Xác nhận nạp tiền

```
[1] Admin vào Admin Dashboard → Mục "Xác nhận nạp tiền"
[2] Danh sách các yêu cầu nạp tiền đang chờ xác minh
[3] Admin xem thông tin từng yêu cầu:
      - Tên người dùng
      - Số tiền khai báo
      - Mã giao dịch tham chiếu
      - Thời gian tạo yêu cầu
[4] Admin đối chiếu với sao kê ngân hàng GoTix
[5] Admin ra quyết định:
```

**Xác nhận:**
```
→ Nhấn "Xác nhận"
→ Số dư ví User được cộng thêm
→ User nhận thông báo "Nạp tiền thành công"
```

**Từ chối:**
```
→ Nhấn "Từ chối" kèm lý do
→ Yêu cầu bị đóng, ví không thay đổi
→ User nhận thông báo từ chối
```

---

## 22. Flow: AI ChatBot hỗ trợ

GoTix tích hợp AI ChatBot nổi (floating) để hỗ trợ người dùng trong suốt quá trình sử dụng.

```
[1] Người dùng thấy nút "GoTix AI" ở góc dưới bên phải màn hình (bất kỳ trang nào)
[2] Nhấn vào nút → Cửa sổ chat mở ra với lời chào mừng
[3] Người dùng có thể:
      - Nhấn các gợi ý nhanh (quick suggestions)
      - Hoặc tự gõ câu hỏi
[4] AI phân tích cảm xúc và ý định trong câu hỏi
[5] AI trả lời kèm danh sách vé liên quan (nếu phù hợp)
[6] Mỗi kết quả vé có thể nhấn để mở trang chi tiết ngay trong chat
[7] Nhấn "Xem tất cả" → Điều hướng đến trang danh sách vé với bộ lọc tương ứng
```

**Ví dụ tình huống hỗ trợ:**
- "Tôi muốn tìm vé concert tháng 6 ở Hà Nội" → AI trả về danh sách vé concert phù hợp
- "Làm sao để đăng bán vé?" → AI hướng dẫn các bước
- "Tiền trong ví dùng để làm gì?" → AI giải thích tính năng ví

---

## 23. Bảng tóm tắt trạng thái vé

| Trạng thái | Hiển thị công khai | Có thể mua | Ý nghĩa |
|---|---|---|---|
| Chờ duyệt | ❌ | ❌ | Vừa được đăng, chờ Admin xem xét |
| Đang bán | ✅ | ✅ | Đã được Admin duyệt, đang nhận đơn hàng |
| Đã bán | ✅ (chỉ thông tin) | ❌ | Đã có người mua thành công |
| Bị từ chối | ❌ | ❌ | Admin từ chối, người bán thấy lý do |
| Bị ẩn | ❌ | ❌ | Admin ẩn do vi phạm |

---

## 24. Bảng tóm tắt trạng thái giao dịch

| Trạng thái | Ý nghĩa | Bước tiếp theo |
|---|---|---|
| Đang chờ thanh toán | Đơn hàng đã tạo, chưa thanh toán | Người mua hoàn tất thanh toán |
| Đang xử lý | Thanh toán đã nhận, đang xác minh | Hệ thống/Admin xác nhận |
| Thành công | Giao dịch hoàn tất | Người mua viết đánh giá, người bán nhận tiền |
| Thất bại | Thanh toán không thành công | Người mua thử lại hoặc hủy |
| Đã hủy | Đơn hàng bị hủy | Tiền hoàn trả (nếu đã thanh toán) |

---

*Tài liệu này phản ánh luồng nghiệp vụ của hệ thống GoTix phiên bản hiện tại. Mọi thay đổi về tính năng cần được cập nhật đồng bộ vào tài liệu này.*
