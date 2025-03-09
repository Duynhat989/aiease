const { Pay, User, Package, PAY_STATUS, STATUS } = require('../models'); // Đảm bảo rằng bạn đã export model Pay
const { License } = require('../models'); // Import model License
const { Sequelize, Op } = require('sequelize');

class Payment {
    constructor() {
    }
    updateInvoice = async (invoice_code) => {
        try {
            // Tìm hóa đơn đang ở trạng thái HOLD
            const pay = await Pay.findOne({
                where: {
                    invoice_code: invoice_code,
                    status_pay: PAY_STATUS.HOLD, // Chỉ xử lý hóa đơn ở trạng thái HOLD
                },
            });

            if (!pay) {
                return { success: false, message: "Invoice code not found or not in HOLD status." }
            }

            // Kiểm tra thông tin license của user
            let license = await License.findOne({
                where: {
                    user_id: pay.user_id,
                },
            });

            const currentDate = new Date(); // Ngày hiện tại
            let newDate;

            if (license) {
                // Trường hợp license tồn tại
                if (license.pack_id === pay.package_id) {
                    // Nếu pack_id trùng, cập nhật date
                    const licenseDate = new Date(license.date);

                    if (licenseDate < currentDate) {
                        // Nếu đã quá hạn, lấy ngày hiện tại + 30 ngày
                        newDate = new Date(currentDate.setDate(currentDate.getDate() + 30 * pay.extension_period));
                    } else {
                        // Nếu chưa quá hạn, lấy ngày trong license + 30 ngày
                        newDate = new Date(licenseDate.setDate(licenseDate.getDate() + 30 * pay.extension_period));
                    }

                    // Cập nhật license
                    await license.update({
                        date: newDate,
                    });
                } else {
                    // Nếu pack_id không trùng, cập nhật pack_id và date
                    newDate = new Date(currentDate.setDate(currentDate.getDate() + 30 * pay.extension_period));

                    await license.update({
                        pack_id: pay.package_id,
                        date: newDate,
                    });
                }
            } else {
                // Nếu license không tồn tại, tạo mới
                newDate = new Date(currentDate.setDate(currentDate.getDate() + 30 * pay.extension_period));

                await License.create({
                    user_id: pay.user_id,
                    pack_id: pay.package_id,
                    date: newDate,
                    status: 1, // Mặc định bật (STATUS.ON)
                });
            }

            // Cập nhật trạng thái hóa đơn về PAID
            await pay.update({
                status_pay: PAY_STATUS.PAID,
            });

            return {
                success: true,
                message: "Invoice processed and updated successfully.",
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    // Kiểm tra xem hóa đơn đã thanh toán hay chưa
    checkInvoiceStatus = async (invoice_code,must_pay) => {
        try {
            const currentDate = new Date(); // Ngày hiện tại
            // Kiểm tra các hóa đơn quá hạn 
            const twoDaysAgo = new Date(currentDate);
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

            // Tìm các hóa đơn ở trạng thái HOLD quá 2 ngày
            const expiredInvoices = await Pay.findAll({
                where: {
                    status_pay: PAY_STATUS.HOLD,
                    updatedAt: {
                        [Op.lt]: twoDaysAgo, // updatedAt < twoDaysAgo
                    },
                },
                order: [["createdAt", "DESC"]],
            });
            // Cập nhật trạng thái của các hóa đơn quá hạn sang CANCELED
            if (expiredInvoices.length > 0) {
                await Pay.update(
                    { status_pay: PAY_STATUS.CANCELED },
                    {
                        where: {
                            id: expiredInvoices.map((invoice) => invoice.id),
                        },
                    }
                );
            }

            // Kiểm tra hóa đơn với invoice_code
            const pay = await Pay.findOne({
                where: {
                    invoice_code: invoice_code,
                    status_pay: PAY_STATUS.HOLD,
                    must_pay:must_pay
                },
                attributes: ['id', 'status_pay', 'invoice_code'], // Chỉ lấy thông tin cần thiết
            });

            if (!pay) {
                return {
                    success: false,
                    message: "Invoice not found.",
                }
            }

            // Kiểm tra trạng thái thanh toán
            const isPaid = pay.status_pay === PAY_STATUS.PAID;

            return {
                success: true,
                invoice_code: pay.invoice_code,
                status: pay.status_pay,//1 hold 2 paid 3 cancel
                isPaid: isPaid,
                message: isPaid ? "Invoice has been paid." : "Invoice is not yet paid.",
            }
        } catch (error) {
            return {
                success: false,
                message: error,
            }
        }
    };

}

module.exports = {
    Payment
}