
const { Telegraf } = require('telegraf')
const { Payment } = require('../../../app/modules/payment.module')

const chatId = "-4066208591"
const botToken = "6416587528:AAFU7PAGwJ-f-6d5Fa1bJX_cm2Mj3b61SXo"

const updateDataBase = async (credit, codePay) => {
  try {
    var payDB = new Payment()
    // Kiểm tra hóa đơn 
    let base = await payDB.checkInvoiceStatus(codePay, credit)
    console.log(base)
    if (base.status) {
      let success = await payDB.updateInvoice(codePay)
      console.log(success)
    }
  } catch (error) {
    console.log(error)
  }
  // return match ? match[1].trim() : null;
};
function extractAIDU(line) {
  const words = line.trim().split(/\s+/);
  const aiduMatch = words.find(word => word.includes("APH"));
  return aiduMatch || null;
}
function extractCredits(line) {
  const match = line.match(/Credit \+([\d,]+\.\d{2}) VND/);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ""));
    return amount
  }
  return null;
}

const addMoneyToSiteWithEmailBalance = async (_form, _body) => {
  let ContentSend = extractContentFromEmail(_body);
  const MoneyCredit = extractMoneyFromEmail(_body);
  let codePay = extractAIDU(ContentSend)
  let credit = extractCredits(MoneyCredit)
  if (codePay && credit) {
    console.log("Pay:", {
      msg: ContentSend,
      code: codePay,
      money: credit,
    })
    updateDataBase(credit, codePay)
  }
};
const extractContentFromEmail = (emailText) => {
  const match = emailText.match(/Content:\s*([^\r\n]+)/);
  return match ? match[1].trim() : null;
};
const extractMoneyFromEmail = (emailText) => {
  const match = emailText.match(/Latest transaction:\s*([^\r\n]+)/);
  return match ? match[1].trim() : null;
};
module.exports = {
  addMoneyToSiteWithEmailBalance,
};
