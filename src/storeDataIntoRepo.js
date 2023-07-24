import { v1 as googleVision } from '@google-cloud/vision';
import { has } from 'lodash';

import { Status } from './Status.enum';
import { updateCorrespondingItemFields } from './updateCorrespondingItemFields';
import { extractTextFromVisionApiResult } from './extractTextFromVisionApiResult';

const metadataFilesDirectory = process.env.METADATA_PATH;
const googleAccessKey = process.env.GOOGLE_SVC;

/**
 *
 * @param {string} metadataFilePath
 * @param {Object} bucket
 * @returns {Promise<void>}
 */

export const storeDataIntoRepo = async (metadataFilePath, bucket) => {
  const client = new googleVision.ImageAnnotatorClient({
    keyFilename: googleAccessKey,
  });
  const metadataPath = `${metadataFilesDirectory}/${metadataFilePath}.json`;
  const metadataFileContainer = bucket.file(metadataPath);

  /**
   * @type {MetadataSchema}
   */
  let [metadataFile] = await metadataFileContainer.download();

  if (!metadataFile)
    return `Can't find corresponding metadata file (Path:${metadataPath}) for visionApi result`;

  metadataFile = JSON.parse(metadataFile);

  const checkOcrOperation = await client.checkAsyncBatchAnnotateFilesProgress(
    metadataFile.ocrData.operationName
  );

  if (has(checkOcrOperation, 'done') && !checkOcrOperation.done)
    return `${metadataFilePath}'s extracting process is not complete yet`;
  const ocrResultData = await extractTextFromVisionApiResult(metadataFile.ocrData);

  /**
   * @type {UpdateField}
   */
  const updateField = { ocrResult: ocrResultData, status: Status.DONE };

  //  Set Result In Repository
  await updateCorrespondingItemFields(metadataFile, updateField);

  return {
    resultFlag: 'ocr process is successfully done.',
    metadataFile,
    metadataFileContainer,
  };
};
