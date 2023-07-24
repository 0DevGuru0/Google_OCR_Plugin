import { promisify } from 'util';
import { pipeline } from 'stream';
import { Storage } from '@google-cloud/storage';
import { v4 as uuid } from 'uuid';
import { logger, PluginError } from './helpers';
import { updateCorrespondingItemFields } from './updateCorrespondingItemFields';
import { Status } from './Status.enum';

const streamPipeline = promisify(pipeline);

const uploadedPdfs = process.env.UPLOADED_PDFS

/**
 * @param {Object} fileReadStream
 * @param {ReadableStream} fileReadStream.body
 * @param {Object} fileReadStream.headers
 * @param {string} url
 * @param {string} bucketName
 * @param {InputData} inputData
 */
export const uploadToGCS = async (fileReadStream, url, bucketName, inputData) => {
  logger.info('Start Uploading Pdf', { url, bucketName });

  // ! Put the Storage initialization here instead of outside the function to be able mock it in the unit test
  const storage = new Storage({
    keyFilename: process.env.GOOGLE_SVC,
  });

  if (!fileReadStream.headers.get('Content-Type').includes('application/pdf'))
    throw new PluginError({ message: 'File Type Is Not Pdf', statusCode: 400 });

  const bucket = storage.bucket(bucketName);
  const fileName = uuid();
  const file = bucket.file(`${uploadedPdfs}/${fileName}`);
  const writeStream = file.createWriteStream({
    metadata: {
      contentType: 'application/pdf',
    },
  });

  try {
    await streamPipeline(fileReadStream.body, writeStream);

    const uploadedFileUrl = `gs://${bucketName}/${uploadedPdfs}/${fileName}`;

    logger.info('Pdf File Uploaded Successfully', {
      url,
      uploadedFileUrl,
    });
    // Change Repo status to `Pending`
    await updateCorrespondingItemFields(inputData, { status: Status.PROCESS });

    return uploadedFileUrl;
  } catch (error) {
    logger.error({ message: error, stack: error.stack });

    throw new PluginError({
      message: 'something went wrong in uploading file to GCS',
      bodyInfo: {
        url,
        bucketName,
      },
      statusCode: 500,
    });
  }
};
