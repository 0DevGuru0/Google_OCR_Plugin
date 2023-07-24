import fetch from 'node-fetch';
import {
  PluginError
} from './helpers';
import {
  uploadToGCS
} from './uploadToGCS';

// TODO: Move this line to uploadTOGCS after setting test environement variables
const bucketName = process.env.BUCKET_NAME;

/**
 * getFileAndUploadToGCS
 * @param {string} url
 * @param {Object} inputData
 */
export const getFileAndUploadToGCS = async (url, inputData) => {
  const fileStreamOrRedirectedURL = await fetch(url, {
    redirect: 'manual',
    headers: {
      authorization: `Bearer ${inputData.apiKey}`
    },
  });

  switch (fileStreamOrRedirectedURL.status) {
    case 302:
    case 301: {
      const fileStream = await fetch(fileStreamOrRedirectedURL.headers.get('location'));
      return uploadToGCS(fileStream, url, bucketName, inputData);
    }
    case 404:
      throw new PluginError({
        message: 'Cannot find File.',
        statusCode: 404
      });
    case 200:
      return uploadToGCS(fileStreamOrRedirectedURL, url, bucketName, inputData);
    default:
      throw new PluginError({
        message: 'Unhandled response.',
        statusCode: 500
      });
  }
};