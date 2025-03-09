const { Smtps } = require('../models'); // Import model từ file models
const { Op } = require("sequelize");

class SmtpManager {
    constructor() {
        if (!SmtpManager.instance) {
            this.smtps = []; // Bộ nhớ tạm lưu trữ SMTPs
            this.isLoadDb = false; // Trạng thái đang load dữ liệu từ DB
            SmtpManager.instance = this;
        }
        return SmtpManager.instance; // Đảm bảo chỉ có một instance duy nhất
    }

    async listActiveSmtps() {
        try {
            const smtps = await Smtps.findAll({
                where: {
                    status: 1,
                },
                order: [['updatedAt', 'ASC']], // Sắp xếp theo updatedAt tăng dần
            });
            return smtps.length > 0 ? smtps : [];
        } catch (error) {
            console.error('Error in listActiveSmtps:', error);
            return [];
        }
    }

    async loadSmtps() {
        if (this.smtps.length === 0) {
            if (this.isLoadDb) {
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (!this.isLoadDb) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
                return;
            }

            this.isLoadDb = true;

            try {
                const data = await this.listActiveSmtps();
                this.smtps = data.map(item => ({
                    id: item.id,
                    email: item.email,
                    password: item.password,
                    config: item.config,
                    status: item.status,
                    updatedAt: item.updatedAt,
                }));
            } catch (error) {
                console.error('Error loading SMTPs:', error);
                throw new Error('Failed to load SMTPs from database');
            } finally {
                this.isLoadDb = false;
            }
        }
    }

    async updateStatus(id) {
        try {
            const smtpRecord = await Smtps.findOne({
                where: { id }
            });
            if (smtpRecord) {
                smtpRecord.status = 2; // Đánh dấu SMTP là OFF
                console.log("Update SMTP status: ", email);
                await smtpRecord.save();
                return smtpRecord;
            } else {
                return { message: 'SMTP not found' };
            }
        } catch (error) {
            return { message: 'Error occurred', error };
        }
    }

    async getSmtp() {
        try {
            await this.loadSmtps();
            if (this.smtps.length === 0) {
                console.log("Remaining SMTPs 1: ", this.smtps.length);
                return null; // Không có SMTP nào để sử dụng
            }
            const smtpData = this.smtps.shift();
            console.log("Remaining SMTPs: ", this.smtps.length);
            // this.updateStatus(smtpData.email);
            return smtpData;
        } catch (error) {
            console.error('Error getting SMTP:', error);
            return null;
        }
    }
}

const instance = new SmtpManager();
module.exports = instance;