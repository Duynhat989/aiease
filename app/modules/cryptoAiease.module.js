const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const fetch = require('node-fetch');

const keyChars = [
    "Q", "@", "D", "2", "4", "=", "o", "u", "e", "V", "%", "]",
    "O", "B", "S", "8", "i", ",", "%", "e", "K", "=", "5", "I",
    "|", "7", "W", "U", "$", "P", "e", "E"
];

// Hàm tạo ID duy nhất
const generateUniqueId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Hàm tạo khóa mã hóa từ keyChars
const generateEncryptionKey = () => {
    // Đúng cách: Sử dụng mảng ký tự nguyên bản, không thay đổi mã ASCII
    const secretKey = keyChars.join("");

    const hashedKey = CryptoJS.SHA256(secretKey).toString(CryptoJS.enc.Hex);
    return CryptoJS.enc.Hex.parse(hashedKey);
}

// Hàm mã hóa dữ liệu
const encrypt = (data) => {
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);

    // Mã hóa URL các ký tự đặc biệt
    const encodedData = encodeURIComponent(dataString);

    const encryptionKey = generateEncryptionKey();
    const iv = CryptoJS.lib.WordArray.random(16);  // Tạo IV ngẫu nhiên
    const encrypted = CryptoJS.AES.encrypt(encodedData, encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CFB,
        padding: CryptoJS.pad.NoPadding
    });

    // Kết hợp IV và ciphertext thành Base64
    const result = CryptoJS.enc.Base64.stringify(iv.concat(encrypted.ciphertext));
    return { t: result };
}

// Hàm giải mã dữ liệu
const decrypt = (encryptedData) => {
    const encryptionKey = generateEncryptionKey();
    const cipherData = CryptoJS.enc.Base64.parse(encryptedData);
    const iv = CryptoJS.lib.WordArray.create(cipherData.words.slice(0, 4), 16);  // Tách IV
    const encryptedContent = CryptoJS.lib.WordArray.create(
        cipherData.words.slice(4),
        cipherData.sigBytes - 16  // Phần còn lại là dữ liệu mã hóa
    );

    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedContent },
        encryptionKey,
        {
            iv: iv,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
        }
    );

    const decryptedString = decodeURIComponent(decrypted.toString(CryptoJS.enc.Utf8));
    // console.log(decryptedString)
    try {
        return JSON.parse(decryptedString);  // Nếu có thể, parse ra JSON
    } catch (e) {
        return decryptedString;  // Nếu không phải JSON, trả về string
    }
}

// Hàm xác định phần mở rộng tệp từ MIME type
const encrypted = (base64String) => {
    let pureBase64 = base64String;
    let mimeType = 'application/octet-stream';  // Mặc định MIME type
    let filename = null;

    // Nếu base64 có chứa phần header data URI
    if (base64String.includes(';base64,')) {
        const parts = base64String.split(';base64,');
        pureBase64 = parts[1];
        if (parts[0].startsWith('data:')) {
            mimeType = parts[0].replace('data:', '');
        }
    }

    // Tạo filename nếu chưa có
    if (!filename) {
        filename = `${generateUniqueId()}.${mimeType.split('/')[1]}`;  // Lấy phần đuôi từ mimeType
    }

    const buffer = Buffer.from(pureBase64, 'base64');

    // Lưu file vào thư mục tạm thời
    const tempDir = path.join(__dirname, 'temp_files');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);  // Tạo thư mục nếu chưa có
    }

    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Trả về đường dẫn file giả định
    const fileInfo = {
        length: buffer.length,
        filetype: mimeType,
        filename: filename,
        filePath: filePath  // Đường dẫn giả định
    };

    // Mã hóa thông tin file
    const encryptedData = encrypt(fileInfo);
    return encryptedData;
}

const sendDirectUploadRequest = async (encryptedString, authToken, options = {}) => {
    try {
        const apiBaseUrl = options.apiBaseUrl || 'https://www.aiease.ai/api';
        const endpoint = options.endpoint || '/api/id_photo/s';
        const timeId = options.timeId || generateUniqueId();

        const url = `${apiBaseUrl}${endpoint}?time=${timeId}`;

        // Tạo Headers
        const headers = {
            'Authorization': `JWT ${authToken}`,
            'Content-Type': 'application/json'
        };

        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: encryptedString
        };

        // Gửi request
        const response = await fetch(url, requestOptions);
        const responseText = await response.text();

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (error) {
            throw new Error(`Invalid JSON response: ${responseText}`);
        }

        return result;
    } catch (error) {
        throw new Error(`API Request Failed: ${error.message}`);
    }
}
const uploadFromBase64 = async (base64String, authToken, options = {}) => {
    try {
        let pureBase64 = base64String;
        let mimeType = options.mimeType || 'image/jpeg';

        if (base64String.includes(';base64,')) {
            const parts = base64String.split(';base64,');
            pureBase64 = parts[1];
            if (parts[0].startsWith('data:')) {
                mimeType = parts[0].replace('data:', '');
            }
        }
        const fileInfo = {
            length: Buffer.from(pureBase64, 'base64').length,
            filetype: mimeType,
            filename: options.filename || `image_${Date.now()}.jpg`
        };
        const encryptedData = encrypt(fileInfo);
        let apiResult = await sendDirectUploadRequest(JSON.stringify(encryptedData), authToken);
        if (apiResult.code == 200) {
            apiResult = await decrypt(apiResult.result)
            const binaryString = atob(pureBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const uploadResponse = await fetch(apiResult, {
                method: 'PUT',
                headers: {
                    'Content-Type': mimeType
                },
                body: bytes
            });
            await uploadResponse.text()
            // Get the final URL (without query parameters)
            const finalUrl = apiResult.split('?')[0];
            return finalUrl
        }
        return false;
    } catch (error) {
        return false;
    }
}

module.exports = {
    generateUniqueId,
    encrypted,
    decrypt,
    encrypt,
    uploadFromBase64
};