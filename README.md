# Fiverr API (Capstone NodeJS)

Backend cho một marketplace dịch vụ freelance theo mô hình Fiverr: người bán đăng gig, người mua đặt đơn và đánh giá, admin kiểm duyệt nội dung.

## Công nghệ

- NestJS 11, TypeScript
- Prisma 7 (adapter MariaDB) với MySQL
- JWT lưu trong cookie httpOnly, đăng nhập Google (Passport)
- Cloudinary (upload ảnh), Swagger (tài liệu API)
- Docker, Docker Compose

## Chức năng

- **Auth:** đăng ký, đăng nhập, đăng xuất, làm mới token, đăng nhập Google.
- **Phân quyền:** ba vai trò `SuperAdmin`, `Admin`, `User`.
- **Danh mục:** category, subcategory group, subcategory (CRUD, xóa mềm).
- **Gig:** danh sách công khai có tìm kiếm, lọc, sắp xếp, phân trang; người bán tạo, sửa, xóa gig và upload ảnh.
- **Đơn hàng:** tạo đơn, đơn mua và đơn bán của tôi, đổi trạng thái theo vai trò (`Pending`, `InProgress`, `Completed`, `Cancelled`).
- **Review:** chỉ người mua của đơn đã hoàn thành; điểm trung bình của gig tự tính lại.
- **Report và kiểm duyệt:** người dùng báo cáo gig, review, user; admin xử lý và ẩn nội dung hoặc khóa tài khoản.
- **Người dùng:** hồ sơ, đổi mật khẩu, avatar, quản lý user dành cho admin.

## Chạy bằng Docker (khuyên dùng)

Yêu cầu: Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

(Trên Windows dùng `copy .env.example .env`.)

- Swagger: http://localhost:3069/docs
- Các API nằm dưới tiền tố `/api`, ví dụ `GET http://localhost:3069/api/gig`.
- MySQL trong Docker công khai ở cổng `3307` của máy (user `root`, mật khẩu là `DB_ROOT_PASSWORD`).
- Lần chạy đầu, MySQL tự nạp file `capstone_nodejs.sql` (cấu trúc bảng và dữ liệu mẫu). Muốn nạp lại từ đầu: `docker compose down -v` rồi chạy lại.

## Chạy không dùng Docker

Yêu cầu: Node.js, MySQL 8 trở lên.

1. Tạo database `capstone_nodejs` rồi import file `capstone_nodejs.sql`.
2. `cp .env.example .env` và sửa `DATABASE_URL` cho đúng MySQL của bạn.
3. Cài thư viện và sinh Prisma client (thư mục client không nằm trong repo):

   ```bash
   npm install
   npx prisma generate
   ```

4. `npm run start:dev`

## Biến môi trường

| Biến                                                              | Ý nghĩa                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `PORT`                                                            | Cổng của ứng dụng                                         |
| `NODE_ENV`                                                        | `development` hoặc `production`                           |
| `DATABASE_URL`                                                    | Chuỗi kết nối MySQL khi chạy app trực tiếp                |
| `DB_ROOT_PASSWORD`                                                | Mật khẩu root MySQL cho docker compose                    |
| `ACCESS_TOKEN_SECRET_KEY`, `REFRESH_TOKEN_SECRET_KEY`             | Khóa bí mật ký JWT                                        |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Cấu hình OAuth Google                                     |
| `FRONTEND_URL`                                                    | Địa chỉ frontend để chuyển hướng sau khi đăng nhập Google |
| `CLOUDINARY_URL`                                                  | Chuỗi kết nối Cloudinary                                  |

Các giá trị trong `.env.example` là giá trị mẫu để ứng dụng khởi động. Muốn thử đăng nhập Google và upload ảnh thì cần khóa thật của riêng bạn.

## Tài khoản demo

Mật khẩu chung: `123456`

| Email                 | Vai trò                            |
| --------------------- | ---------------------------------- |
| sa.test@gmail.com     | SuperAdmin                         | đổi vai trò (Update user role), khóa hoặc xóa tài khoản Admin                                 |
| admin.test@gmail.com  | Admin                              | tạo, sửa, xóa danh mục, danh sách order và report, xử lý report, đổi moderation, quản lý user |
| user.test@gmail.com   | User (người bán gig 1 đến 5 và 9)  | tạo gig, đặt đơn, review, tạo report, my-gigs, my-orders                                      |
| seller.demo@gmail.com | User (người bán gig 6 đến 8 và 10) |

## Tài liệu API

- Swagger tại `/docs`. Để thử các route cần đăng nhập, gọi `POST /api/auth/signin` ngay trong trang Swagger; trình duyệt tự lưu cookie cho các request sau.
- Bản Postman collection nằm trong thư mục `docs/`.

## Cấu trúc thư mục

```
src/
├── common/          decorator, guard, interceptor, filter, helper dùng chung
├── modules-api/     auth, user, category, subcategory-group, subcategory, gig, order, review, report
└── modules-system/  prisma, token, cloudinary
```

## Hướng phát triển

Chat 1-1 bằng WebSocket, giới hạn tần suất request (rate limit), Redis cho cache và token blacklist.
