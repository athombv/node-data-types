/* eslint-disable node/no-missing-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */
/* eslint-disable import/extensions */

'use strict';

// TODO: fix requires not breaking

function getDataType() {
  // return require('../lib/DataType');
  return require('../lib_ts/DataType').DataType;
}

function getDataTypes() {
  // return require('../lib/DataTypes');
  return require('../lib_ts/DataTypes').DataTypes;
}

function getStruct() {
  // return require('../lib/Struct');
  return require('../lib_ts/Struct').Struct;
}

function getBitmap() {
  // return require('../lib/Bitmap');
  return require('../lib_ts/Bitmap').Bitmap;
}

module.exports = {
  getStruct,
  getDataType,
  getDataTypes,
  getBitmap,
};
