/**
 * MetadataSchema
 * @typedef {Object} MetadataSchema
 * @property {Object} ocrData
 * @property {string} ocrData.fileUrl
 * @property {string} ocrData.destinationUri
 * @property {string} ocrData.operationName
 * @property {string} ocrData.bucketName
 * @property {Object} config
 * @property {string} userToken
 * @property {string} collectionId
 * @property {string} orgDomain
 * @property {Object} item
 *
 */

/**
 * UpdateField
 * @typedef {Object} UpdateField
 * @property {string} status
 * @property {{text:string;page:number}[]} [ocrResult] - optional
 *
 */

/**
 * InputData
 * @typedef {Object} InputData
 * @property {string} orgDomain
 * @property {string} userToken
 * @property {string} collectionId
 * @property {Object} config
 * @property {string} config.resultField
 * @property {string} config.statusField
 * @property {string} config.processStatus
 * @property {string} config.pdfField
 * @property {Object} item
 */
