import {
  v4 as uuid
} from 'uuid';
import {
  v1 as googleVision
} from '@google-cloud/vision';
import * as extractTextFromVisionApiResult from '../extractTextFromVisionApiResult';
import * as repositoryActions from '../updateCorrespondingItemFields';
import {
  storeDataIntoRepo
} from '../storeDataIntoRepo';

jest.mock('@google-cloud/vision');

const metadata = {
  ocrData: {
    fileUrl: 'gs://asd232ws23213dsr1sad21',
    destinationUri: 'google-ocr-result/q432ik4em32i',
    bucketName: 'tempBucket',
    operationName: 'operation/afdssad/locations/asdfasd',
  },
  config: {
    pdfField: 'SecondArticle',
    resultField: 'ocrResult',
    statusField: 'ocrStatus',
    processStatus: 'Ready',
  },
  apiKey: uuid(),
  userToken: '%#$%#%#%#$%#$%$%#$%',
  orgDomain: 'https://metadata-extractor.nightly.repo.avidcloud.io',
  item: {
    schema: {
      label: 'OCRPlug',
      _id: '5f0ac67a35f76e000870fc49',
      name: 'OcrPlugin',
    },
    _id: '5f0accab35f76e000870fc55',
    SecondArticle: {
      _id: '5f0acc8f35f76e000870fc54',
      fileName: 'Important-Tips.pdf',
      fileSize: 469853,
      mimeType: 'application/pdf',
      blobType: 'PDF',
    },
    ocrResult: null,
    ocrStatus: 'Ready',
  },
};

describe('visionApi', () => {
  let mockedCheckAsyncBatchAnnotateFilesProgress;
  let mockedExtractTextFromVisionApiResult;
  let mockedUpdateCorrespondingItemFields;
  let mockedBucket;
  let mockedDownload;
  let mockedFile;

  beforeEach(() => {
    mockedDownload = jest.fn();
    mockedFile = jest.fn().mockReturnValue({
      download: mockedDownload,
    });

    mockedBucket = {
      file: mockedFile,
    };

    mockedCheckAsyncBatchAnnotateFilesProgress = jest.fn();

    jest.spyOn(googleVision, 'ImageAnnotatorClient').mockReturnValueOnce({
      checkAsyncBatchAnnotateFilesProgress: mockedCheckAsyncBatchAnnotateFilesProgress,
    });

    mockedExtractTextFromVisionApiResult = jest.spyOn(
      extractTextFromVisionApiResult,
      'extractTextFromVisionApiResult'
    );

    mockedUpdateCorrespondingItemFields = jest
      .spyOn(repositoryActions, 'updateCorrespondingItemFields')
      .mockResolvedValueOnce([]);
  });

  afterEach(() => {
    mockedExtractTextFromVisionApiResult.mockClear();
    mockedUpdateCorrespondingItemFields.mockClear();
  });

  it('should get metadata file and set visionApi result', async () => {
    const metadataFilePath = 'as2df341lm3ewr342314';
    const ocrResult = 'ocrResultData';
    mockedDownload.mockResolvedValue([JSON.stringify(metadata)]);
    mockedCheckAsyncBatchAnnotateFilesProgress.mockResolvedValueOnce({
      done: true
    });
    mockedExtractTextFromVisionApiResult.mockResolvedValueOnce(ocrResult);

    await expect(storeDataIntoRepo(metadataFilePath, mockedBucket)).resolves.toEqual({
      resultFlag: 'ocr process is successfully done.',
      metadataFile: metadata,
      metadataFileContainer: mockedFile(),
    });

    expect(mockedUpdateCorrespondingItemFields).toHaveBeenCalledWith(metadata, {
      ocrResult,
      status: 'done',
    });
    expect(mockedUpdateCorrespondingItemFields).toHaveBeenCalledTimes(1);
    expect(mockedCheckAsyncBatchAnnotateFilesProgress).toHaveBeenCalledTimes(1);
    expect(mockedDownload).toHaveBeenCalledTimes(1);
    expect(mockedExtractTextFromVisionApiResult).toHaveBeenCalledTimes(1);
  });

  it('should get metadata file and return that visionApi process is incomplete yet', async () => {
    const metadataFilePath = 'as2df341lm3ewr342314';
    mockedDownload.mockResolvedValue([JSON.stringify(metadata)]);
    mockedCheckAsyncBatchAnnotateFilesProgress.mockResolvedValueOnce({
      done: false
    });
    mockedExtractTextFromVisionApiResult.mockResolvedValueOnce('ocrResultData');

    await expect(storeDataIntoRepo(metadataFilePath, mockedBucket)).resolves.toEqual(
      `${metadataFilePath}'s extracting process is not complete yet`
    );

    expect(mockedDownload).toHaveBeenCalledTimes(1);
    expect(mockedUpdateCorrespondingItemFields).toHaveBeenCalledTimes(0);
    expect(mockedExtractTextFromVisionApiResult).toHaveBeenCalledTimes(0);
    expect(mockedCheckAsyncBatchAnnotateFilesProgress).toHaveBeenCalledTimes(1);
  });

  it('should stop proceeding the process when metadata file is null', async () => {
    const metadataFilePath = 'as2df341lm3ewr342314';
    mockedDownload.mockResolvedValue([null]);

    await expect(storeDataIntoRepo(metadataFilePath, mockedBucket)).resolves.toEqual(
      `Can't find corresponding metadata file (Path:metadata/${metadataFilePath}.json) for visionApi result`
    );
    expect(mockedDownload).toHaveBeenCalledTimes(1);
    expect(mockedUpdateCorrespondingItemFields).toHaveBeenCalledTimes(0);
    expect(mockedExtractTextFromVisionApiResult).toHaveBeenCalledTimes(0);
    expect(mockedCheckAsyncBatchAnnotateFilesProgress).toHaveBeenCalledTimes(0);
  });
});