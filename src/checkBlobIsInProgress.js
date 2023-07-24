import { Storage } from '@google-cloud/storage';
import { PluginError } from './helpers';

export const checkBlobIsInProgress = async (blobId) => {
  const storage = new Storage({
    keyFilename: process.env.GOOGLE_SVC,
  });

  const bucket = storage.bucket(process.env.BUCKET_NAME);
  const [isMetadataFileExist] = await bucket
    .file(`${process.env.METADATA_PATH}/${blobId}.json`)
    .exists();

  if (isMetadataFileExist) {
    throw new PluginError({
      message: 'specified pdf file is in the ocr process,Please wait until ocr process finished',
      statusCode: 400,
    });
  }
};
