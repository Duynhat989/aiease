const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/config");

const LoginHistory = sequelize.define("LoginHistory", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users", // Tên bảng Users
      key: "id", // Khóa chính của bảng Users
    },
    onDelete: "CASCADE", // Xóa bản ghi khi user bị xóa
    onUpdate: "CASCADE", // Cập nhật khi userId thay đổi
  },
  loginTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Mặc định là thời gian hiện tại
  },
  ipAddress: {
    type: DataTypes.STRING, // Địa chỉ IP của người dùng khi đăng nhập
    allowNull: true,
    validate: {
      isIP: true, // Đảm bảo giá trị là một địa chỉ IP hợp lệ
    },
  },
  userAgent: {
    type: DataTypes.STRING, // Thông tin trình duyệt hoặc thiết bị
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING, // Trạng thái đăng nhập (ví dụ: thành công, thất bại)
    allowNull: false,
    validate: {
      isIn: [["SUCCESS", "FAILURE"]], // Chỉ chấp nhận SUCCESS hoặc FAILURE
    },
  },
});

module.exports = {
  LoginHistory,
};
