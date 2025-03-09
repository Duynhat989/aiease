const { sequelize } = require("../config/config");

const { ROLES, User } = require('../models/userModel');
const { STATUS, Setup } = require('../models/setupModel');
const { LoginHistory } = require("./loginHistoryModel");
const { Saves } = require("./saveModel");




sequelize.sync({ force: false }).then(() => {
  console.log('Database đã được đồng bộ!');
});
module.exports = {
  User,
  ROLES,
  STATUS,
  Setup,
  LoginHistory,
  Saves
};