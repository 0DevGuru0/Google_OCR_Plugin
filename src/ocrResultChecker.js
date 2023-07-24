import { Storage } from '@google-cloud/storage';
import { uniq } from 'lodash';

import { logger } from './helpers';
import { storeDataIntoRepo } from './storeDataIntoRepo';
import { removeOCRStaleFiles } from './removeOCRStaleFiles';

/**
 * output directory
 *
 * metadata/
 *  12431234234.json
 *  970s8f987asf.json
 *
 * ocrResults/
 *  12431234234/0.json
 *  12431234234/1.json
 *  970s8f987asf/output1.json
 *  970s8f987asf/output2.json
 *  970s8f987asf/output3.json
 */

/**
 * extractOcrResultFile
 * @param {Object} ocrMetadata
 * @returns {Promise<{text:string,page:number}[]>} return Container
 */

const bucketName = process.env.BUCKET_NAME;
const outputDir = process.env.OUTPUT_DIR;

// eslint-disable-next-line consistent-return
export const ocrResultChecker = async () => {
  const storage = new Storage({
    keyFilename: process.env.GOOGLE_SVC,
  });

  const bucket = storage.bucket(bucketName);

  const [ocrResultFilesPath] = await bucket.getFiles({
    prefix: `${outputDir}/`,
    autoPaginate: false,
  });
  if (!ocrResultFilesPath || ocrResultFilesPath.length === 0)
    return 'No File Has Been Received Yet.';

  const ocrResultDirectories = ocrResultFilesPath.map((ocrResultFile) => {
    // ocrResultFile.name is google-ocr-result/[BLOB_ID]/[OUTPUT_JSON]
    return ocrResultFile.name.split('/')[1];
  });

  const ocrResultUniqueDirectories = uniq(ocrResultDirectories);

  const ocrResultFiles = ocrResultUniqueDirectories.map(async (ocrResultDir) => {
    let info;
    try {
      const { resultFlag, metadataFile, metadataFileContainer } = await storeDataIntoRepo(
        ocrResultDir,
        bucket
      );
      info = resultFlag;
      await removeOCRStaleFiles(metadataFile, metadataFileContainer);
    } catch (error) {
      return { ocrResultFile: ocrResultDir, error: error.message };
    }
    return {
      ocrResultFile: ocrResultDir,
      error: null,
      info,
    };
  });

  const container = await Promise.all(ocrResultFiles);

  logger.info(
    ocrResultFiles.length > 0
      ? JSON.stringify({ ocrResultFiles: container, Date: new Date() })
      : 'No File Has been Resolved Yet.'
  );
};
