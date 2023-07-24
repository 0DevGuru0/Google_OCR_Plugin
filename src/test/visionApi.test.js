import * as GCSModule from '@google-cloud/storage';
import {
  v1 as googleVision
} from '@google-cloud/vision';

import visionApi from '../visionApi';

jest.mock('@google-cloud/vision');
jest.mock('@google-cloud/storage');
jest.mock('graphql-request');

describe('visionApi', () => {
  let mockedGCS;
  let mockedBucket;
  let mockedFile;
  let mockedVisionApi;
  let mockedAsyncBatchAnnotateFiles;

  beforeEach(() => {
    mockedFile = jest.fn().mockReturnValue({
      save: jest.fn(),
    });
    mockedBucket = jest.fn().mockReturnValue({
      file: mockedFile,
    });

    mockedGCS = jest.spyOn(GCSModule, 'Storage').mockReturnValue({
      bucket: mockedBucket,
    });

    mockedAsyncBatchAnnotateFiles = jest.fn().mockResolvedValue([{
      promise: jest.fn(),
    }, ]);

    mockedVisionApi = jest.spyOn(googleVision, 'ImageAnnotatorClient').mockReturnValue({
      asyncBatchAnnotateFiles: mockedAsyncBatchAnnotateFiles,
    });
  });

  afterEach(() => {
    mockedFile.mockClear();
    mockedBucket.mockClear();
    mockedVisionApi.mockClear();
    mockedGCS.mockClear();
  });

  it('should return filePath that extracted texts', async () => {
    const fileName = 'fileNameInGCS';
    const id = '5f0acc8f35f76e000870fc54';
    const destinationUri = `${process.env.OUTPUT_DIR}/${id}`;
    const input = {
      config: {
        pdfField: 'SecondArticle',
        statusField: 'ocrStatus',
      },
      userToken: 'sad223213214',
      apiKey: 'sadxczm-lefwfms-kdlcxzv-dkslfnksf',
      item: {
        _id: '5f0accab35f76e000870fc15',
        schema: {
          _id: '5f0ac67a35f76e000870fc49',
          name: 'OcrPlugin',
        },
        ocrStatus: null,
        SecondArticle: {
          _id: id,
          fileName: 'Important-Tips-April2020.pdf',
          fileSize: 469853,
          mimeType: 'application/pdf',
          blobType: 'PDF',
        },
      },
    };
    const result = await visionApi(fileName, input);
    expect(result).toEqual({
      destinationUri,
      id,
      metadataPath: process.env.METADATA_PATH,
    });
    expect(mockedAsyncBatchAnnotateFiles).toHaveBeenCalledTimes(1);
    expect(mockedBucket).toHaveBeenCalledTimes(1);
    expect(mockedGCS).toHaveBeenCalledTimes(1);
    expect(mockedFile).toHaveBeenCalledTimes(1);
  });
});