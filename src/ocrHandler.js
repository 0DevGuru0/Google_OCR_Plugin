import { get } from 'lodash';

import { contentExtractor } from './contentExtractor';
import validateConfigInstance from './validateConfigInstance';

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const getFilePath = ({ item, config, orgDomain }) => {
  const { _id } = get(item, config.pdfField);
  return `${orgDomain}/api/v1/blob/${_id}`;
};

/**
 * @param {Object} param
 * @param {object} param.body
 */
export const ocrHandler = async ({ body }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    body = JSON.parse(body);

    const { items, ...commonConfig } = body;

    const ocrProcesses = [];
    for (const item of items) {
      // Validate event
      await validateConfigInstance({ ...body, item });

      const configPerItem = { ...commonConfig, item };

      const filePath = getFilePath(configPerItem);

      // Call Google OCR to extract the info
      ocrProcesses.push(contentExtractor(filePath, configPerItem));
    }

    await Promise.all(ocrProcesses);

    return {
      headers,
      statusCode: 200,
      body: `Your Article${
        body.items.length === 1 ? '' : 's'
      } has been started Extracting successfully`,
    };
  } catch (error) {
    return {
      headers,
      body: JSON.stringify({
        message: error.message,
        bodyInfo: error.bodyInfo || '',
      }),
      statusCode: error.statusCode || 500,
    };
  }
};
