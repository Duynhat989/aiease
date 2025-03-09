const { Smtps, Schedules, Emails } = require('../app/models')
const EmailSender = require('../app/modules/smtps.module')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms * 100));

const emailManager = require('../app/modules/smtpManager.module');
const senderEmail = async (order, customer) => {
    let smtp = await emailManager.getSmtp()
    if (smtp) {
        console.log(customer)
        const sender = new EmailSender(smtp.email.trim(), smtp.password.trim())
        const checked = await sender.checkAccount();
        if (!checked) {
            // Lỗi smtp xử lý sao đó
        }
        let newInbox = async (email, keywords) => {
            let htmlBase = order.html
            // Thêm trình random class tránh quét nội dung
            htmlBase = htmlBase.split(`@@email@@`).join(`${email}`)
            for (const keyword of keywords) {
                htmlBase = htmlBase.split(`${keyword.name}`).join(`${keyword.value}`)
            }
            return htmlBase
        }
        let htmlSend = await newInbox(customer.mail, JSON.parse(customer.config).keywords)
        let dataSend = await sender.sendEmail({
            to: customer.mail,
            subject: order.subject,
            html: htmlSend,
            from: order.business,
            m_id: customer.id
        })
        // console.log("dataSend", dataSend.accepted);
        if (JSON.stringify(dataSend.accepted).length > 10) {
            console.log('Vào inbox')
            await Emails.update(
                { status: 2 },
                { where: { id: customer.id } }
            );
        } else {
            console.log("Vào spam nè")
            await Emails.update(
                { status: 3 },
                { where: { id: customer.id } }
            );
        }
    } else {

    }
};
const OrderManeger = new Set(); // Dùng Set để tối ưu kiểm tra

const getIdOrder = async () => {
    // Lấy danh sách có status = 2
    let dules = await Schedules.findAll({
        where: { status: 2 },
        attributes: ["id", "name", "timezone", "html", "subject", "business", "startDate", "endDate", "telegramBot"],
        order: [["createdAt", "ASC"]],
    });

    // Lọc ra các id chưa có trong OrderManeger
    let tempDules = dules.filter(dule => !OrderManeger.has(dule.id));
    if (tempDules.length > 0) {
        OrderManeger.add(tempDules[0].id); // Dùng Set để thêm
        return tempDules[0];
    }

    // Nếu không có status = 2, tìm tiếp status = 1
    dules = await Schedules.findAll({
        where: { status: 1 },
        attributes: ["id", "name", "timezone", "html", "subject", "business", "startDate", "endDate", "telegramBot"],
        order: [["createdAt", "ASC"]],
        limit: 1,
    });

    if (dules.length > 0) {
        await Schedules.update(
            { status: 2 },
            { where: { id: dules[0].id } }
        );
        OrderManeger.add(dules[0].id);
        return dules[0];
    }

    return null;
};
const processSmtpWorker = async (thead) => {
    while (true) {
        // console.log(`Worker: ${thead}`, OrderManeger);
        let order = await getIdOrder();
        if (order) {
            while (true) {
                let emails = await Emails.findAll({
                    where: { status: 1 },
                    limit: 20 // Tăng limit để chia nhóm
                });

                if (emails.length === 0) {
                    // Hết danh sách email, cập nhật trạng thái schedule
                    await Schedules.update({ status: 3 }, { where: { id: order.id } });
                    break;
                }

                const batchSize = 10; // Số email gửi đồng thời
                for (let i = 0; i < emails.length; i += batchSize) {
                    let batch = emails.slice(i, i + batchSize);

                    // Gửi email song song trong nhóm bằng Promise.all()
                    await Promise.all(
                        batch.map((mail, index) =>
                            new Promise(resolve => setTimeout(async () => {
                                await senderEmail(order, {
                                    id: mail.id,
                                    mail: mail.email,
                                    config: mail.config
                                });
                                resolve();
                            }, index * 20))
                        )
                    );
                    await sleep(1);
                }
            }
            OrderManeger.delete(order.id);
        }
        await sleep(100);
    }
};

// Số giây 10s
const processSmtp = async () => {
    const numWorkers = 3; // Số luồng chạy song song
    for (let index = 0; index < numWorkers; index++) {
        setTimeout(() => {
            processSmtpWorker(index)
        }, index * 2000)
    }
};

module.exports = { processSmtp };
