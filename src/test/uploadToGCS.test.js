import mockFS from 'mock-fs';
import fs from 'fs';
import * as GCSModule from '@google-cloud/storage';
import {
  uploadToGCS
} from '../uploadToGCS';
import * as RepositoryActions from '../updateCorrespondingItemFields';

jest.mock('@google-cloud/storage');
jest.mock('graphql-request');
jest.mock('uuid', () => ({
  v4: () => '1234',
}));

describe('uploadToGCS', () => {
  let mockedGCS;
  let mockedBucket;
  let mockedFile;
  let mockedRepo;

  beforeEach(() => {
    mockFS({
      'temp.pdf': new Buffer.alloc(100),
      'dest.pdf': new Buffer.alloc(100),
    });

    mockedRepo = jest.spyOn(RepositoryActions, 'updateCorrespondingItemFields');

    mockedFile = jest.fn().mockReturnValue({
      createWriteStream: jest.fn().mockImplementation(() => {
        return fs.createWriteStream('dest.pdf');
      }),
    });
    mockedBucket = jest.fn().mockReturnValue({
      file: mockedFile,
    });

    mockedGCS = jest.spyOn(GCSModule, 'Storage').mockReturnValue({
      bucket: mockedBucket,
    });
  });

  afterEach(() => {
    mockedFile.mockClear();
    mockedBucket.mockClear();
    mockedGCS.mockClear();
    mockedRepo.mockClear();
    mockFS.restore();
  });

  it('should throw an error when the "content-type" is not "application/pdf"', async () => {
    const fileReadStream = {
      headers: {
        get: () => 'application/json',
      },
    };

    await expect(
      uploadToGCS(fileReadStream, 'metadata-extractor.repo.cloud.io', 'tempBucket')
    ).rejects.toThrow('File Type Is Not Pdf');
  });

  it('should read file stream pipe it to write into the GCS', async () => {
    const fileReadStream = {
      headers: {
        get: () => 'application/pdf',
      },
      body: fs.createReadStream('temp.pdf'),
    };
    const input = {
      config: {
        pdfField: 'furtherArticles.miscellaneous.secondArticle',
        statusField: 'ocrStatus',
      },
      userToken: 'sad223213214',
      apiKey: 'asdxz-ascxz-asfxv-wq-23',
      item: {
        _id: '5f0accab35f76e000870fc15',
        schema: {
          _id: '5f0ac67a35f76e000870fc49',
          name: 'OcrPlugin',
        },
        ocrStatus: null,
      },
    };
     await uploadToGCS(
      fileReadStream,
      'metadata-extractor.repo.cloud.io/blob/5edb294690c12d14af6d0d7c',
      'tempBucket',
      input
    );
     
    // TODO: assert this test when process env can be used inside tests
    // expect(res).toEqual('gs://tempBucket/uploaded-pdfs/1234');

    expect(mockedBucket).toHaveBeenCalledWith('tempBucket');
    expect(mockedGCS).toHaveBeenCalledWith({
      keyFilename: process.env.GOOGLE_SVC,
    });
    expect(mockedRepo).toHaveBeenCalledTimes(1);
  });

  it('should return error when file is not stream', async () => {
    const fileReadStream = {
      headers: {
        get: () => 'application/pdf',
      },
      body: null,
    };
    const url = 'metadata-extractor.repo.cloud.io/blob/5edb294690c12d14af6d0d7c';
    const bucketName = 'tempBucket';

    const res = await expect(uploadToGCS(fileReadStream, url, bucketName));
    res.rejects.toThrow();
    res.rejects.toHaveProperty('statusCode', 500);
    res.rejects.toHaveProperty('bodyInfo', {
      url,
      bucketName,
    });
    expect(mockedRepo).toHaveBeenCalledTimes(0);
  });
});