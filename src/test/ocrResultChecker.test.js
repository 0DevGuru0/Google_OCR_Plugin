import * as GCSModule from '@google-cloud/storage';
import * as ocrController from '../ocrResultChecker';
import * as storeDataIntoRepo from '../storeDataIntoRepo';
import * as removeOCRStaleFiles from '../removeOCRStaleFiles';

jest.mock('@google-cloud/storage');

describe('ocrResultChecker', () => {
  let mockedGetFiles;
  let mockedStoreDataIntoRepo;
  let mockedRemoveOcrStaleFiles;

  beforeEach(() => {
    mockedGetFiles = jest.fn();
    const mockedBucket = jest.fn().mockReturnValue({
      getFiles: mockedGetFiles,
    });

    jest.spyOn(GCSModule, 'Storage').mockReturnValue({
      bucket: mockedBucket,
    });

    mockedRemoveOcrStaleFiles = jest.spyOn(removeOCRStaleFiles, 'removeOCRStaleFiles');

    mockedStoreDataIntoRepo = jest
      .spyOn(storeDataIntoRepo, 'storeDataIntoRepo')
      .mockResolvedValue('ocr process is successfully done.');
  });

  afterEach(() => {
    mockedGetFiles.mockClear();
    mockedStoreDataIntoRepo.mockClear();
  });

  it('should return that no file received', async () => {
    mockedGetFiles.mockResolvedValue([]);
    await expect(ocrController.ocrResultChecker()).resolves.toEqual(
      'No File Has Been Received Yet.'
    );
  });

  it('should get OCR-result file and set them', async () => {
    const ocrResultDir = 'q432ik4em32i';
    const ocrResultFilePath = [{ name: `google-ocr-result/${ocrResultDir}/output.json` }];
    const bucket = {
      getFiles: mockedGetFiles,
    };

    mockedGetFiles.mockResolvedValue([ocrResultFilePath]);
    mockedRemoveOcrStaleFiles.mockResolvedValue();
    await ocrController.ocrResultChecker();

    expect(mockedStoreDataIntoRepo).toHaveBeenCalledTimes(1);
    expect(mockedStoreDataIntoRepo).toHaveBeenCalledWith(ocrResultDir, bucket);
    expect(mockedRemoveOcrStaleFiles).toHaveBeenCalledTimes(1);
    expect(mockedRemoveOcrStaleFiles).toHaveBeenCalledTimes(1);
  });
});
