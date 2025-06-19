# Ứng Dụng Truyền File
# Giao diện người gửi
![image](https://github.com/user-attachments/assets/39e1a521-6a1d-4647-b2e6-5306fc3d347b)
# Giao diện người nhận
![image](https://github.com/user-attachments/assets/568587f5-e83a-4b8b-b676-7a91a633127d)

## Giới thiệu
Đây là một ứng dụng web cho phép **truyền file dữ liệu có ký số** giữa hai người dùng qua WebSocket. Ứng dụng sử dụng **thuật toán RSA** để tạo cặp khóa, ký file và xác minh tính toàn vẹn của file sau khi truyền.

## Tính năng
- Tạo cặp khóa RSA trực tiếp trên trình duyệt.
- Ký số file với khóa riêng.
- Truyền file cùng với chữ ký và khóa công khai qua WebSocket.
- Người nhận có thể tải file về và tự động nhận khóa công khai.
- Xác minh chữ ký của file đã nhận để kiểm tra tính toàn vẹn.

## Thành phần
- **Người Gửi:**  
  Tạo khóa, chọn file, ký file và gửi file qua socket.
  
- **Người Nhận:**  
  Nhận file, kiểm tra khóa công khai và xác minh chữ ký.

- **Server:**  
  Web server chạy Flask và WebSocket, chuyển tiếp file từ người gửi đến người nhận.

- **Script:**  
  Xử lý các chức năng tạo khóa, ký số, gửi nhận file và xác minh chữ ký trên trình duyệt.

