const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/config");
const STATUS_SAVE = {
  ON: 1, //process
  OFF: 2, //done
  ERROR: 3 //error
};
// Định nghĩa model User
const Saves = sequelize.define(
  "Saves",
  {
    processId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    valueProcess: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: STATUS_SAVE.ON,
      validate: {
        isIn: [[STATUS_SAVE.ON, STATUS_SAVE.OFF,STATUS_SAVE.ERROR]],
      },
    },
  }
);
module.exports = { Saves, STATUS_SAVE };