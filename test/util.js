/* eslint-disable node/no-missing-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */

'use strict';

function getDataType() {
  return require('../lib/DataType');
}

function getDataTypes() {
  return require('../lib/DataTypes');
}

function getStruct() {
  return require('../lib/Struct');
}

function getBitmap() {
  return require('../lib/Bitmap');
}

module.exports = {
  getStruct,
  getDataType,
  getDataTypes,
  getBitmap,
};