// TODO: replace node-fetch with phin (it's ultra light-weight)
import * as fetch from 'node-fetch';
import {
  v4 as uuid
} from 'uuid';
import {
  getFileAndUploadToGCS
} from '../getFileAndUploadToGCS';
import * as uploadToGCSModule from '../uploadToGCS';

describe('getFileAndUploadToGCS', () => {
  let mockedFetch;
  let mockedUploadToGCS;

  const inputData = {
    orgDomain: 'https://metadata-extractor.nightly.repo.avidcloud.io',
    apiKey: uuid(),
  };
  const url =
    'https://metadata-extractor.nightly.repo.avidcloud.io/api/v1/blob/5f0acc8f35f76e000870fc54';

  beforeEach(() => {
    mockedFetch = jest.spyOn(fetch, 'default');

    mockedUploadToGCS = jest
      .spyOn(uploadToGCSModule, 'uploadToGCS')
      .mockResolvedValue('gs://bucketName/uploadedFileName.pdf');
  });

  afterEach(() => {
    mockedFetch.mockClear();
    mockedUploadToGCS.mockClear();
  });

  it('should download file when redirected to a new location', async () => {
    const redirectedURL = 's3/blob/1234';
    mockedFetch
      .mockResolvedValueOnce({
        status: 301,
        headers: {
          get: () => redirectedURL,
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        body: {},
      });

    const res = await getFileAndUploadToGCS(url, inputData);

    expect(res).toEqual('gs://bucketName/uploadedFileName.pdf');

    expect(mockedUploadToGCS).toHaveBeenCalledTimes(1);
    expect(mockedUploadToGCS).toHaveBeenCalledWith({
        status: 200,
        body: {},
      },
      url,
      process.env.BUCKET_NAME,
      inputData
    );
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch).toHaveBeenNthCalledWith(1, url, {
      redirect: 'manual',
      headers: {
        authorization: `Bearer ${inputData.apiKey}`
      },
    });
    expect(mockedFetch).toHaveBeenNthCalledWith(2, redirectedURL);
  });

  it('should throw an error when file not found', async () => {
    mockedFetch.mockResolvedValue({
      status: 404,
      body: {},
    });
    await expect(getFileAndUploadToGCS(url, inputData)).rejects.toThrow('Cannot find File.');
    expect(mockedUploadToGCS).toHaveBeenCalledTimes(0);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('should call writeToGCS for OCR', async () => {
    mockedFetch.mockResolvedValueOnce({
      status: 200,
      body: {},
    });

    const res = await getFileAndUploadToGCS(url, inputData);

    expect(res).toEqual('gs://bucketName/uploadedFileName.pdf');

    expect(mockedUploadToGCS).toHaveBeenCalledTimes(1);
    expect(mockedUploadToGCS).toHaveBeenCalledWith({
        status: 200,
        body: {},
      },
      url,
      process.env.BUCKET_NAME,
      inputData
    );
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(url, {
      redirect: 'manual',
      headers: {
        authorization: `Bearer ${inputData.apiKey}`
      },
    });
  });

  it('should throw an error when get unhandled response status code', async () => {
    mockedFetch.mockResolvedValue({
      status: 500,
      body: {},
    });

    await expect(getFileAndUploadToGCS(url, inputData)).rejects.toThrow('Unhandled response.');
    expect(mockedUploadToGCS).toHaveBeenCalledTimes(0);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });
});