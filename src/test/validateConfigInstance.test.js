import {
  v4 as uuid
} from 'uuid';
import * as checkBlobIsInProgress from '../checkBlobIsInProgress';
import validate from '../validateConfigInstance';

const configInstance = {
  orgId: '5ef2d436ceab1b0008e172c3',
  orgDomain: 'https://metadata-extractor.nightly.repo.avidcloud.io',
  config: {
    pdfField: 'SecondArticle',
    resultField: 'ocrResultBlob',
    statusField: 'ocrStatus',
  },
  apiKey: uuid(),
  userToken: '%#$%#%#%#$%#$%$%#$%',
  executionId: '1234',
  collectionId: '5f0accab35f76e000870fc55',
  itemId: '5f0ad16635f76e000870fc58',
  item: {
    _id: '5f0ad16635f76e000870fc58',
    ocrStatus: 'ready',
    schema: {
      _id: '5f0ac67a35f76e000870fc49',
      name: 'OcrPlugin',
    },
    SecondArticle: {
      _id: '5f3b802428b7b6000967e392',
      fileName: 'biology - 10.pdf',
      fileSize: 6733516,
      mimeType: 'application/pdf',
      blobType: 'PDF',
    },
    ocrResultBlob: null,
  },
};

describe('validateConfigInstance', () => {
  let mockedCheckBlobIsInProgress;

  beforeEach(() => {
    mockedCheckBlobIsInProgress = jest.spyOn(checkBlobIsInProgress, 'checkBlobIsInProgress');
  });

  it('should return error when statusField is not Ready', async () => {
    const individualConfig = {
      ...configInstance,
      item: {
        _id: '5f0ad16635f76e000870fc58',
        ocrStatus: 'notReady',
        schema: {
          _id: '5f0ac67a35f76e000870fc49',
          name: 'OcrPlugin',
        },
        SecondArticle: {
          _id: '5f3b802428b7b6000967e392',
          fileName: 'biology - 10.pdf',
          fileSize: 6733516,
          mimeType: 'application/pdf',
          blobType: 'PDF',
        },
        ocrResultBlob: null,
      },
    };
    mockedCheckBlobIsInProgress.mockResolvedValue();
    await expect(validate(individualConfig)).rejects.toThrow({
      message: 'ocrStatus is not Ready to start Plugin',
      statusCode: 102,
    });
  });

  it('should return error when corresponding pdfField has not _id property', async () => {
    const individualConfig = {
      ...configInstance,
      item: {
        _id: '5f0ad16635f76e000870fc58',
        schema: {
          _id: '5f0ac67a35f76e000870fc49',
          name: 'OcrPlugin',
        },
        SecondArticle: {
          fileName: 'biology - 10.pdf',
          fileSize: 6733516,
          mimeType: 'application/pdf',
          blobType: 'PDF',
        },
        ocrResultBlob: null,
      },
    };

    mockedCheckBlobIsInProgress.mockResolvedValue();

    await expect(validate(individualConfig)).rejects.toThrow({
      message: "can'\t find pdf id",
      statusCode: 404,
    });
  });

  it("should return error when orgDomain doesn't set", async () => {
    const individualConfig = {
      ...configInstance,
      orgDomain: undefined,
    };

    mockedCheckBlobIsInProgress.mockResolvedValue();

    await expect(validate(individualConfig)).rejects.toThrow({
      message: 'please enter file path.',
      statusCode: 400,
    });
  });

  it("should return error when orgDomain isn't valid", async () => {
    const individualConfig = {
      ...configInstance,
      orgDomain: 'htt/isNotValid',
    };

    mockedCheckBlobIsInProgress.mockResolvedValue();

    await expect(validate(individualConfig)).rejects.toThrow({
      message: 'please enter valid file path.',
      statusCode: 400,
    });
  });

  it('should return error when checkBlobInProgress throw error', async () => {
    const message =
      'specified pdf file is in the ocr process,Please wait until ocr process finished';
    const statusCode = 400;

    mockedCheckBlobIsInProgress.mockRejectedValue({
      message,
      statusCode
    });

    await expect(validate(configInstance)).rejects.toEqual({
      message,
      statusCode,
    });
  });

  it('should return error when apiKey doesn\'t set', async () => {
    const individualConfig = {
      ...configInstance,
      apiKey: undefined,
    };

    mockedCheckBlobIsInProgress.mockResolvedValue();

    await expect(validate(individualConfig)).rejects.toThrow({
      message: 'please enter apiKey.',
      statusCode: 400,
    });
  });
});