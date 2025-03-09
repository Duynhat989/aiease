const { STATUS, loadApiKey } = require("../models");


// Lấy danh sách tất cả học sinh
exports.cronjob = async (req, res) => {
    // Lấy khóa api
    try { 
        


        res.status(200).json({
            success: true,
            data: uploadResponse.data,
            id: fileId
        }); // Gửi ID tệp về client
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to upload file'
        });
    }
};