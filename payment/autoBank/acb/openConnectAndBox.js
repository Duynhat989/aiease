const hand = require("./handle");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
let NUM_EMAILS = 20;
let LIMIT_DELAY = 60;
let mail = ''
let pass = ''
const connectAndBox = () => {
  console.log('Log')
  const imapConfig = {
    user: mail,
    password: pass,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  };
  const imap = new Imap(imapConfig);
  imap.connect();
  const openBox = () => {
    imap.openBox("INBOX", false, function (err, box) {
      if (err) throw err;
      const searchCriteria = [["FROM", "mailalert@acb.com.vn"]];
      imap.search(searchCriteria, (err, results) => {
        // Xử lý kết quả
        let newEmails = null;
        if (results.length > parseInt(NUM_EMAILS)) {
          newEmails = results.slice(-parseInt(NUM_EMAILS));
        } else {
          newEmails = results;
        }
        const f = imap.fetch(newEmails, { bodies: "" });
        f.on("message", function (msg, seqno) {
          var buffer = "";
          msg.on("body", function (stream, info) {
            stream.on("data", function (chunk) {
              buffer += chunk.toString("utf8");
            });
            stream.once("end", function () {
              simpleParser(buffer, (err, mail) => {
                if (err) throw err;
                //info em
                hand.addMoneyToSiteWithEmailBalance(mail.from.text, mail.text);
              });
            });
          });

          msg.once("end", function () { });
        });
        f.once("end", function () {
          console.log("Done fetching all messages!");
        });
      });
    });
  };
  imap.once("ready", function () {
    console.log("Connection is ready");
    openBox();
  });

  imap.once("error", function (err) {
    console.log(err);
  });

  imap.once("end", function () {
    console.log("Connection ended");
    imap.end();
  });
};
async function startChecking(mail_set, pass_set, NUM_EMAILS_set, LIMIT_DELAY_set) {
  try {
    mail = mail_set
    pass = pass_set

    console.log("Email: ", mail)
    NUM_EMAILS = NUM_EMAILS_set
    LIMIT_DELAY = LIMIT_DELAY_set
    connectAndBox()
    await delay()
    startChecking(mail_set, pass_set, NUM_EMAILS_set, LIMIT_DELAY_set)
  } catch (error) {
    console.log("Email loading: ",error)
  }
}
const sleep = async (seconds) => {
  return new Promise((resolve, reject) =>
    setTimeout(() => resolve(true), 1000 * seconds)
  );
};
const delay = async () => {
  console.log(`Wait : ${LIMIT_DELAY} seconds`);
  for (let i = LIMIT_DELAY; i > 0; i--) {
    await sleep(1);
  }
  return;
};
module.exports = {
  startChecking,
};
