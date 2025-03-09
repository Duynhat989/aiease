

const generateUniqueId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


module.exports = {
    generateUniqueId
}
/**
 * Class để mã hóa, giải mã và upload file trong Node.js
 */
class CryptoService {
    constructor(options = {}) {
        // Khởi tạo module CryptoJS
        this.CryptoJS = require('crypto-js');
        this.axios = require('axios');
        this.fs = require('fs');
        this.path = require('path');
        this.FormData = require('form-data');
        this.fetch = require('node-fetch');

        // JWT token
        this.authToken = options.authToken || '';

        // Mảng ký tự để tạo khóa
        this.keyChars = [
            "Q", "@", "D", "2", "4", "=", "o", "u", "e", "V", "%", "]",
            "O", "B", "S", "8", "i", ",", "%", "e", "K", "=", "5", "I",
            "|", "7", "W", "U", "$", "P", "e", "E"
        ];

        // API base URL
        this.apiBaseUrl = options.apiBaseUrl || 'https://www.aiease.ai/api';
    }
    setAuthToken(token) {
        this.authToken = token;
    }
    generateEncryptionKey() {
        // Tạo chuỗi khóa từ mảng ký tự
        const secretKey = this.keyChars.map(char => {
            const charCode = char.charCodeAt(0) + 1;
            return String.fromCharCode(charCode - 1);
        }).join("");

        // Tạo hash key
        const hashedKey = this.CryptoJS.SHA256(secretKey).toString(this.CryptoJS.enc.Hex);
        return this.CryptoJS.enc.Hex.parse(hashedKey);
    }
    encrypt(data) {
        // Đảm bảo dữ liệu là string
        const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);

        // Tạo khóa mã hóa
        const encryptionKey = this.generateEncryptionKey();

        // Tạo vector khởi tạo ngẫu nhiên 16 byte
        const iv = this.CryptoJS.lib.WordArray.random(16);

        // Mã hóa dữ liệu
        const encodedData = encodeURIComponent(dataString);
        const encrypted = this.CryptoJS.AES.encrypt(encodedData, encryptionKey, {
            iv: iv,
            mode: this.CryptoJS.mode.CFB,
            padding: this.CryptoJS.pad.NoPadding
        });

        // Kết hợp IV và ciphertext, chuyển thành Base64
        const result = this.CryptoJS.enc.Base64.stringify(iv.concat(encrypted.ciphertext));

        // Trả về kết quả dạng object
        return { t: result };
    }
    decrypt(encryptedData) {
        // Tạo khóa mã hóa
        const encryptionKey = this.generateEncryptionKey();

        // Parse chuỗi Base64 thành WordArray
        const cipherData = this.CryptoJS.enc.Base64.parse(encryptedData);

        // Tách IV (16 bytes đầu tiên)
        const iv = this.CryptoJS.lib.WordArray.create(cipherData.words.slice(0, 4), 16);

        // Tách phần dữ liệu đã mã hóa (phần còn lại)
        const encryptedContent = this.CryptoJS.lib.WordArray.create(
            cipherData.words.slice(4),
            cipherData.sigBytes - 16
        );

        // Giải mã
        const decrypted = this.CryptoJS.AES.decrypt(
            { ciphertext: encryptedContent },
            encryptionKey,
            {
                iv: iv,
                mode: this.CryptoJS.mode.CFB,
                padding: this.CryptoJS.pad.NoPadding
            }
        );

        // Giải mã URL và trả về kết quả
        const decryptedString = decodeURIComponent(decrypted.toString(this.CryptoJS.enc.Utf8));

        // Thử parse JSON nếu có thể
        try {
            return JSON.parse(decryptedString);
        } catch (e) {
            // Nếu không phải JSON, trả về string
            return decryptedString;
        }
    }
    encryptFileInfo(fileInfo) {
        return this.encrypt(fileInfo);
    }
    generateUniqueId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    async requestWithAuth(encryptedData, endpoint = '/api/id_photo/s') {
        try {
            const timeId = this.generateUniqueId();
            const url = `${this.apiBaseUrl}${endpoint}?time=${timeId}`;

            // Tạo Headers
            const headers = {
                'Authorization': `JWT ${this.authToken}`,
                'Content-Type': 'application/json'
            };

            // Tạo request options
            const requestOptions = {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(encryptedData)
            };

            // Gửi request
            const response = await this.fetch(url, requestOptions);
            const responseText = await response.text();

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (error) {
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            if (result.code !== 200) {
                throw new Error(`API Error: ${result.message || 'Unknown error'}`);
            }

            return result;
        } catch (error) {
            throw new Error(`API Request Failed: ${error.message}`);
        }
    }
    async encryptFileFromPath(filePath) {
        try {
            // Lấy thông tin file
            const stats = await this.fs.promises.stat(filePath);
            const filename = this.path.basename(filePath);
            const fileExtension = this.path.extname(filename).toLowerCase();

            // Xác định mime type dựa trên phần mở rộng file
            let filetype = 'application/octet-stream';
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            };

            if (mimeTypes[fileExtension]) {
                filetype = mimeTypes[fileExtension];
            }

            const fileInfo = {
                length: stats.size,
                filetype: filetype,
                filename: filename
            };

            return this.encrypt(fileInfo);
        } catch (error) {
            throw new Error(`Error processing file: ${error.message}`);
        }
    }

    async uploadFromUrl(imageUrl) {
        try {
            // Tải file từ URL
            const response = await this.axios.get(imageUrl, { responseType: 'arraybuffer' });
            // Lấy tên file từ URL
            const filename = this.path.basename(new URL(imageUrl).pathname);

            // Xác định loại file từ Content-Type hoặc phần mở rộng
            let filetype = response.headers['content-type'] || 'application/octet-stream';

            // Thông tin file
            const fileInfo = {
                length: response.data.length,
                filetype: filetype,
                filename: filename
            };

            // Mã hóa thông tin file
            const encryptedData = this.encrypt(fileInfo);

            // Gửi yêu cầu API với authentication
            const apiResult = await this.requestWithAuth(encryptedData);

            if (!apiResult.result) {
                throw new Error('Failed to get upload URL from API response');
            }

            // Giải mã URL upload
            let uploadUrl;
            try {
                uploadUrl = this.decrypt(apiResult.result);
            } catch (error) {
                throw new Error(`Failed to decrypt upload URL: ${error.message}`);
            }

            if (!uploadUrl) {
                throw new Error('Empty upload URL after decryption');
            }

            // Upload file
            const uploadResponse = await this.axios.put(uploadUrl, response.data, {
                headers: {
                    'Content-Type': filetype
                }
            });

            // Lấy URL cuối cùng (không chứa query params)
            const finalUrl = uploadUrl.split('?')[0];

            return {
                status: uploadResponse.status,
                uploadUrl: uploadUrl,
                finalUrl: finalUrl,
                apiResponse: apiResult
            };
        } catch (error) {
            throw new Error(`Upload from URL failed: ${error.message}`);
        }
    }

    async uploadFile(filePath) {
        try {
            // Mã hóa thông tin file
            const encryptedData = await this.encryptFileFromPath(filePath);

            // Gửi yêu cầu API với authentication
            const apiResult = await this.requestWithAuth(encryptedData);

            if (!apiResult.result) {
                throw new Error('Failed to get upload URL from API response');
            }

            // Giải mã URL upload
            let uploadUrl;
            try {
                uploadUrl = this.decrypt(apiResult.result);
            } catch (error) {
                throw new Error(`Failed to decrypt upload URL: ${error.message}`);
            }

            if (!uploadUrl) {
                throw new Error('Empty upload URL after decryption');
            }

            // Xác định mime type
            const filename = this.path.basename(filePath);
            const fileExtension = this.path.extname(filename).toLowerCase();
            let contentType = 'application/octet-stream';
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            };

            if (mimeTypes[fileExtension]) {
                contentType = mimeTypes[fileExtension];
            }

            // Đọc file
            const fileBuffer = await this.fs.promises.readFile(filePath);

            // Upload file với PUT request
            const uploadResponse = await this.axios.put(uploadUrl, fileBuffer, {
                headers: {
                    'Content-Type': contentType
                }
            });

            // Lấy URL cuối cùng (không chứa query params)
            const finalUrl = uploadUrl.split('?')[0];

            return {
                status: uploadResponse.status,
                uploadUrl: uploadUrl,
                finalUrl: finalUrl,
                apiResponse: apiResult
            };
        } catch (error) {
            throw new Error(`File upload failed: ${error.message}`);
        }
    }
    getMimeExtension(mimeType) {
        const mimeToExt = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'text/plain': '.txt',
            'text/html': '.html',
            'text/css': '.css',
            'text/javascript': '.js',
            'application/json': '.json',
            'application/xml': '.xml'
        };
        
        return mimeToExt[mimeType] || '.bin';
    }
    async uploadFromBase64(base64String, filename = null, mimeType = 'application/octet-stream') {
        try {
            // Xử lý chuỗi base64 nếu có phần header 'data:image/jpeg;base64,'
            let pureBase64 = base64String;
            if (base64String.includes(';base64,')) {
                const parts = base64String.split(';base64,');
                pureBase64 = parts[1];
                // Lấy MIME type từ header nếu không được chỉ định
                if (mimeType === 'application/octet-stream' && parts[0].startsWith('data:')) {
                    mimeType = parts[0].replace('data:', '');
                }
            }
            
            // Tự động tạo tên file nếu không được cung cấp
            if (!filename) {
                const fileExt = this.getMimeExtension(mimeType);
                filename = `${this.generateUniqueId()}${fileExt}`;
            }
            
            // Chuyển đổi base64 thành buffer
            const buffer = Buffer.from(pureBase64, 'base64');
            
            // Thông tin file
            const fileInfo = {
                length: buffer.length,
                filetype: mimeType,
                filename: filename
            };
            
            // Mã hóa thông tin file
            const encryptedData = this.encrypt(fileInfo);
            
            // Gửi yêu cầu API với authentication
            const apiResult = await this.requestWithAuth(encryptedData);
            
            if (!apiResult.result) {
                throw new Error('Failed to get upload URL from API response');
            }
            
            // Giải mã URL upload
            let uploadUrl;
            try {
                uploadUrl = this.decrypt(apiResult.result);
            } catch (error) {
                throw new Error(`Failed to decrypt upload URL: ${error.message}`);
            }
            
            if (!uploadUrl) {
                throw new Error('Empty upload URL after decryption');
            }
            
            // Upload file
            const uploadResponse = await this.axios.put(uploadUrl, buffer, {
                headers: {
                    'Content-Type': mimeType
                }
            });
            
            // Lấy URL cuối cùng (không chứa query params)
            const finalUrl = uploadUrl.split('?')[0];
            
            return {
                status: uploadResponse.status,
                uploadUrl: uploadUrl,
                finalUrl: finalUrl,
                apiResponse: apiResult
            };
        } catch (error) {
            throw new Error(`Upload from base64 failed: ${error.message}`);
        }
    }
}

module.exports = CryptoService;