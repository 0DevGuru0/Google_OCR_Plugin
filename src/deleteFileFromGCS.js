import { Storage } from '@google-cloud/storage';
import { logger, PluginError } from './helpers';

/**
 * DeleteFileFromGCS
 * @param {string} path
 * @param {boolean} isFolder
 */
export default async (path, isFolder) => {
  const bucketName = process.env.BUCKET_NAME;
  const storage = new Storage({
    keyFilename: process.env.GOOGLE_SVC,
  });
  try {
    if (isFolder) {
      await storage.bucket(bucketName).deleteFiles({
        force: true,
        prefix: path,
      });
    } else {
      await storage.bucket(bucketName).file(path).delete();
    }
    logger.info(`${isFolder ? 'Folder' : 'File'} Deleted Successfully`, {
      path,
      bucketName,
    });
  } catch (error) {
    logger.error(error);
    throw new PluginError({
      message: 'Deleting Operation Is Failed',
      bodyInfo: {
        bucketName,
        path,
      },
      statusCode: 500,
    });
  }
};
