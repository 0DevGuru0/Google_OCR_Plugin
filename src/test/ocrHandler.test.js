import {
  v4 as uuid
} from 'uuid';
import {
  eventGenerator
} from '../helpers';
import * as googleOcr from '../ocrHandler';
import * as contentExtractorModule from '../contentExtractor';
import * as validateConfigInstance from '../validateConfigInstance';

const input = {
  orgDomain: 'https://metadata-extractor.nightly.repo.avidcloud.io',
  config: {
    pdfField: 'SecondArticle',
    statusField: 'ocrStatus',
  },
  apiKey: uuid(),
  items: [{
    _id: '5f0accab35f76e000870fc55',
    schema: {
      _id: '5f0ac67a35f76e000870fc49',
      name: 'OcrPlugin',
    },
    ocrStatus: 'ready',
    SecondArticle: {
      _id: '5f0acc8f35f76e000870fc54',
      mimeType: 'application/pdf',
      blobType: 'PDF',
    },
  }, ],
};
const filePath =
  'https://metadata-extractor.nightly.repo.avidcloud.io/api/v1/blob/5f0acc8f35f76e000870fc54';

const headers = {
  'Access-Control-Allow-Origin': '*',
};

describe('ocrHandler', () => {
  let mockedContentExtractor;
  let mockedValidateConfigInstance;

  beforeEach(() => {
    mockedContentExtractor = jest
      .spyOn(contentExtractorModule, 'contentExtractor')
      .mockResolvedValue();
    mockedValidateConfigInstance = jest.spyOn(validateConfigInstance, 'default');
  });

  afterEach(() => {
    mockedContentExtractor.mockClear();
    mockedValidateConfigInstance.mockClear();
  });

  it('should ocr the single article', async () => {
    mockedValidateConfigInstance.mockResolvedValue();
    const event = eventGenerator({
      body: input,
    });

    await expect(googleOcr.ocrHandler(event)).resolves.toEqual({
      headers,
      body: 'Your Article has been started Extracting successfully',
      statusCode: 200,
    });

    const {
      items,
      ...inputWithoutItems
    } = input;

    expect(mockedContentExtractor).toHaveBeenCalledTimes(1);
    expect(mockedContentExtractor).toHaveBeenCalledWith(filePath, {
      ...inputWithoutItems,
      item: items[0],
    });
  });

  it('should ocr the multiple articles', async () => {
    mockedValidateConfigInstance.mockResolvedValue();

    // Duplicate items
    const event = eventGenerator({
      body: {
        ...input,
        items: input.items.concat(input.items)
      },
    });

    await expect(googleOcr.ocrHandler(event)).resolves.toEqual({
      headers,
      body: 'Your Articles has been started Extracting successfully',
      statusCode: 200,
    });

    const {
      items,
      ...inputWithoutItems
    } = input;

    expect(mockedContentExtractor).toHaveBeenCalledTimes(2);
    expect(mockedContentExtractor).toHaveBeenNthCalledWith(1, filePath, {
      ...inputWithoutItems,
      item: items[0],
    });
    expect(mockedContentExtractor).toHaveBeenNthCalledWith(2, filePath, {
      ...inputWithoutItems,
      item: items[0],
    });
  });

  it('should return error when validateConfigInstance throw Error', async () => {
    const message = 'some validation went wrong';
    const statusCode = 400;

    mockedValidateConfigInstance.mockRejectedValue({
      message,
      statusCode,
    });

    const event = eventGenerator({
      body: input,
    });

    await expect(googleOcr.ocrHandler(event)).resolves.toEqual({
      headers,
      body: JSON.stringify({
        message,
        bodyInfo: ''
      }),
      statusCode,
    });

    expect(mockedContentExtractor).toHaveBeenCalledTimes(0);
  });
});