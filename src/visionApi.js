import {
  get
} from 'lodash';
import {
  Storage
} from '@google-cloud/storage';
import {
  v1 as googleVision
} from '@google-cloud/vision';

import {
  updateCorrespondingItemFields
} from './updateCorrespondingItemFields';
import {
  logger,
  PluginError
} from './helpers';
import {
  Status
} from './Status.enum';

const bucketName = process.env.BUCKET_NAME;
const metadataPath = process.env.METADATA_PATH;
const googleAccessKey = process.env.GOOGLE_SVC;
const outputDir = process.env.OUTPUT_DIR;

/**
 * output directory
 *
 * metadata/
 *  12431234234.json
 *  970s8df987asf.json
 */

/**
 * VisionApi
 * @param {string} fileUrl
 * @param {InputData} inputData
 * @returns {Promise<{destinationUri: string; id: string; metadataPath: string;}>} returnPromise
 */
export default async (fileUrl, inputData) => {
  logger.info({
    message: 'Start Sending Pdf To VisionApi.',
    fileUrl
  });
  const client = new googleVision.ImageAnnotatorClient({
    keyFilename: googleAccessKey,
  });

  // store blobId instead of random id
  const ocrBlob = get(inputData.item, inputData.config.pdfField);
  const id = ocrBlob._id;
  const destinationUri = `${outputDir}/${id}`;
  const gcsDestinationUri = `gs://${bucketName}/${destinationUri}/`;

  const inputConfig = {
    mimeType: 'application/pdf',
    gcsSource: {
      uri: fileUrl,
    },
  };

  const outputConfig = {
    gcsDestination: {
      uri: gcsDestinationUri,
    },
    batchSize: 50,
  };

  const features = [{
    type: 'DOCUMENT_TEXT_DETECTION'
  }];

  const request = {
    requests: [{
      inputConfig,
      features,
      outputConfig,
    }, ],
  };

  try {
    const [operation] = await client.asyncBatchAnnotateFiles(request);

    operation.promise();

    const {
      config,
      userToken,
      item,
      orgDomain,
      collectionId,
      apiKey
    } = inputData;

    /**
     * @type {MetadataSchema}
     */
    const metadataSchema = {
      ocrData: {
        fileUrl,
        destinationUri,
        bucketName,
        operationName: operation.name,
      },
      config,
      collectionId,
      userToken,
      item,
      orgDomain,
      apiKey
    };

    const storage = new Storage({
      keyFilename: googleAccessKey,
    });

    const bucket = storage.bucket(bucketName);
    const fileMetadata = bucket.file(`${metadataPath}/${id}.json`);

    await fileMetadata.save(JSON.stringify(metadataSchema));

    // Change Repo status to `Processing`
    await updateCorrespondingItemFields(inputData, {
      status: Status.EXTRACT
    });

    logger.info({
      message: 'Your Article Has Been Sent To VisionApi.',
      fileUrl,
      destinationUri: gcsDestinationUri,
      metadataPath,
      id,
    });

    return {
      destinationUri,
      id,
      metadataPath
    };
  } catch (error) {
    logger.error({
      message: error,
      stack: error.stack
    });

    throw new PluginError({
      message: 'Error Occurred In Extracting File',
      bodyInfo: {
        fileUrl,
        bucketName,
      },
      statusCode: 500,
    });
  }
};