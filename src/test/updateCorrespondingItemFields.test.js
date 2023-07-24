import {
  v4 as uuid
} from 'uuid';
import * as graphqlRequest from 'graphql-request';
import {
  updateCorrespondingItemFields
} from '../updateCorrespondingItemFields';

jest.mock('form-data');
jest.mock('graphql-request');

const destinationUri = 'google-ocr-result/65176277-cad1-4b79-aabb-eb1bfe6dccda';
const itemId = '5f0accab35f76e000870fc55';
const apiKey = uuid();
const input = {
  ocrData: {
    fileUrl: 'gs://tempBucket/442ad04e-dd7c-42fc-a3ce-676811b7b1c7',
    destinationUri,
    bucketName: 'tempBucket',
  },
  orgDomain: 'https://metadata-extractor.nightly.repo.avidcloud.io',
  apiKey,
  config: {
    statusField: 'ocrStatus',
    resultField: 'ocrResult',
  },
  item: {
    _id: itemId,
    schema: {
      _id: '5f0ac67a35f76e000870fc49',
      name: 'OcrPlugin',
    },
    ancestors: ['000000000000', '0000000000123', '1254as15s4f5f4'],
    ocrStatus: 'processing',
    ocrResult: {},
  },
};

describe('updateCorrespondingItemFields', () => {
  let mockedGraphQLClient;
  let mockedRequest;

  beforeEach(() => {
    mockedRequest = jest.fn();
    mockedGraphQLClient = jest.spyOn(graphqlRequest, 'GraphQLClient').mockReturnValue({
      request: mockedRequest,
    });
  });

  afterEach(() => {
    mockedRequest.mockClear();
    mockedGraphQLClient.mockClear();
  });

  it('should change status Field in the root of Repository', async () => {
    await updateCorrespondingItemFields(input, {
      status: 'pending'
    });
    // prettier-ignore
    // eslint-disable-next-line quotes
    const query = /* GraphQL */ `mutation($item: UpdateOcrPlugins_OcrPluginItems!) { updateOcrPlugins(items: [$item]) { _id } }`;

    const variable = {
      item: {
        _id: '5f0accab35f76e000870fc55',
        ocrStatus: 'pending'
      },
    };

    expect(mockedGraphQLClient).toHaveBeenCalledTimes(1);
    expect(mockedRequest).toHaveBeenCalledWith(query, variable);
  });

  it('should change status to done and set result in repository', async () => {
    const ocrResult = [{
      text: 'simple test file',
      page: {
        number: 1,
        pageDimension: {
          width: '20',
          height: '20'
        }
      },
      paragraphs: [{
        text: 'simple test file',
        boundingBox: {
          normalizedVertices: [{
              x: 10,
              y: 20
            },
            {
              x: 10,
              y: 20
            },
            {
              x: 10,
              y: 20
            },
            {
              x: 10,
              y: 20
            },
          ],
        },
      }, ],
    }, ];

    // set OcrResult Id
    const ocrResultFileId = '5f27f75eecd8d2000800f6cb';
    const ocrResultFileName = 'ocrResult.json';

    const mockedUploadPresignedURL = {
      getBlobUploadSignedUrl: [{
        _id: ocrResultFileId,
        fileName: ocrResultFileName,
        blobType: 'Text',
        url: 'https://amazonaws.com/avid-nightly',
        formFields: {
          'Content-Type': 'application/json',
          'Key': 'zQoY-ocrResult.json',
          'bucket': 'avid-nightly',
          'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
          'X-Amz-Credential': 'AKL4VS73SJ57FDW5/20200803/test-1/s3/aws4_request',
          'X-Amz-Date': '20200803T113910Z',
          'Policy': 'IwMjAwODAzVDExMkxMFifV19',
          'X-Amz-Signature': '621b3ad2d62ead3a7',
        },
      }, ],
    };

    mockedRequest.mockResolvedValueOnce({
      ...mockedUploadPresignedURL
    });

    // prettier-ignore
    const queryForGetBlobUploadSignedUrl = /* GraphQL */ `
query($blobsInfo: [UploadBlobInfoInput!]!, $collectionId: ObjectId!) {
  getBlobUploadSignedUrl(blobsInfo: $blobsInfo, collectionId: $collectionId) {
    _id
    url
    formFields
  }
}
`;
    const GetBlobUploadSignedUrlVariables = {
      blobsInfo: [{
        fileName: 'ocrResult.json',
        fileSize: 242,
        mimeType: 'application/json',
      }, ],
      collectionId: '1254as15s4f5f4',
    };

    await updateCorrespondingItemFields(input, {
      ocrResult: [ocrResult],
      status: 'done'
    });

    expect(mockedGraphQLClient).toHaveBeenCalledTimes(1);

    expect(mockedGraphQLClient).toHaveBeenCalledWith(`${input.orgDomain}/api/v1/graphql`, {
      headers: {
        authorization: `Bearer ${apiKey}`
      },
    });

    expect(mockedRequest).toHaveBeenCalledTimes(2);

    expect(mockedRequest).toHaveBeenNthCalledWith(
      1,
      queryForGetBlobUploadSignedUrl,
      GetBlobUploadSignedUrlVariables
    );

    // prettier-ignore
    // eslint-disable-next-line quotes
    const query = /* GraphQL */ `mutation($item: UpdateOcrPlugins_OcrPluginItems!) { updateOcrPlugins(items: [$item]) { _id } }`;

    const variable = {
      item: {
        _id: itemId,
        [input.config.resultField]: [ocrResultFileId],
        ocrStatus: 'done',
      },
    };

    expect(mockedRequest).toHaveBeenLastCalledWith(query, variable);
  });
});