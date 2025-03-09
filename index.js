const path = require('path')
const http = require('http')
const express = require('express')

const bodyParser = require('body-parser')
const cors = require('cors')


const { connectDB } = require('./app/config/config');
connectDB();
// Khai báo app
const app = express();
const server = http.createServer(app);
// Mở công giao tiếp công khai
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// Khái báo đăng ký routes
const { authRoutes,
    userRoutes,
    setupRoutes,
    aieaseRoutes
} = require('./app/routes');
const { Mailer } = require('./app/nodemailer')
app.use('/api/auth', authRoutes);
app.use("/api", userRoutes);
app.use("/api", setupRoutes);
app.use("/api", aieaseRoutes);



const mailer = new Mailer()
mailer.index()
// Khợi động auto bank
// const autoBank = require('./payment/index')
// autoBank.payLoop()
// Khi có một kết nối mới được thiết lập
const PORT = 2053;
server.listen(PORT, () => console.log(`Listen: ${PORT}`));
