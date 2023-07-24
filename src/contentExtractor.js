import { getFileAndUploadToGCS } from './getFileAndUploadToGCS';
import visionApi from './visionApi';

/**
 * @param {string} filePath
 * @param {Object} inputData
 * @returns {void}
 */
export const contentExtractor = async (filePath, inputData) => {
  const uploadedFileUrl = await getFileAndUploadToGCS(filePath, inputData);
  await visionApi(uploadedFileUrl, inputData);
};
