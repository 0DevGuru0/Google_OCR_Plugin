/**
 * EventGenerator
 * @param {Object} params
 * @param {Object} params.body
 * @param {Object} params.queryStringObject
 * @returns {Object} returnObj
 * @returns {string} returnObj.body
 * @returns {string} returnObj.queryStringObject
 */
export default ({ body, queryStringObject }) => {
  return {
    body: body ? JSON.stringify(body) : undefined,
    queryStringParameters: queryStringObject ? JSON.stringify(queryStringObject) : undefined,
  };
};
