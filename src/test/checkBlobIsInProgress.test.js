import * as GCSModule from '@google-cloud/storage';
import { checkBlobIsInProgress } from '../checkBlobIsInProgress';

jest.mock('@google-cloud/storage');

describe('checkBlobIsInProgress', () => {
  let mockedFile;
  let mockedExists;

  beforeEach(() => {
    mockedExists = jest.fn();

    mockedFile = jest.fn().mockReturnValue({
      exists: mockedExists,
    });

    const mockedBucket = jest.fn().mockReturnValue({
      file: mockedFile,
    });

    jest.spyOn(GCSModule, 'Storage').mockReturnValue({
      bucket: mockedBucket,
    });
  });

  afterEach(() => {
    mockedFile.mockClear();
    mockedExists.mockClear();
  });

  it('should return error when pdf is in ocr process', async () => {
    mockedExists.mockResolvedValue([true]);

    await expect(checkBlobIsInProgress('5f0ad16635f76e000870fc58')).rejects.toThrow({
      message: 'specified pdf file is in the ocr process,Please wait until ocr process finished',
      statusCode: 400,
    });
  });

  it('should return undefined when pdf is not in ocr process', async () => {
    mockedExists.mockResolvedValue([false]);

    await expect(checkBlobIsInProgress('5f0ad16635f76e000870fc58')).resolves.toBeUndefined();
  });
});
