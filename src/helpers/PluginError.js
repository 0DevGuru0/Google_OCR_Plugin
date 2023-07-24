/**
 * @class
 */
export default class PluginError extends Error {
  /**
   * PluginError
   * @param {Object} param
   * @param {string} param.message
   * @param {string|object} [param.bodyInfo]
   * @param {number} param.statusCode
   */
  constructor({ message, bodyInfo = '', statusCode }) {
    super();
    this.message = message;
    this.bodyInfo = bodyInfo;
    this.statusCode = statusCode;
  }
}
