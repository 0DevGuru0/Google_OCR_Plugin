import FormData from 'form-data';
import jsonSize from 'json-size';
import pluralize from 'pluralize';
import { last, has, upperFirst } from 'lodash';
import { GraphQLClient } from 'graphql-request';
import { logger, PluginError } from './helpers';
/*
const changeObject = (address, data, item) => {
  const addressArr = address.split('.');
  if (addressArr.length === 1) {
    const updateItemBlock = set(item, address, data);
    const updateFieldValue = updateItemBlock[address];
    return [address, updateFieldValue];
  }

  throw new PluginError({
    message: `${address} should be in root of item object`,
    statusCode: 400,
  });
  
  TODO: following structure will be enable for nested field availability
    const updateFieldName = addressArr.shift();
    const rootObj = item[updateFieldName];

    const updatedObj = set({}, addressArr, data);

    const upFirstLetter = (s) => s.replace(/./, (m) => m.toUpperCase());
    const updateItemSchema = `${upFirstLetter(updateSchema)}_${schemaName}_${upFirstLetter(
      updateFieldName
      )}Items`;
      
      const updateField = defaultsDeep(updatedObj, rootObj);
      
      return [updateField, updateFieldName, updateItemSchema];
};
*/
const uploadJson = async ({ resultsJson, collectionId, graphQLClient }) => {
  const blobsInfo = [];

  for (const resultJson of resultsJson) {
    // 1__>> Determine resultJson size
    const ocrResultJsonSize = jsonSize(resultJson);

    // 2__>> GetUploadSignedUrl
    const ocrResultFileName = 'ocrResult.json';

    blobsInfo.push({
      fileName: ocrResultFileName,
      fileSize: ocrResultJsonSize,
      mimeType: 'application/json',
    });
  }

  // prettier-ignore
  const query = /* GraphQL */ `
query($blobsInfo: [UploadBlobInfoInput!]!, $collectionId: ObjectId!) {
  getBlobUploadSignedUrl(blobsInfo: $blobsInfo, collectionId: $collectionId) {
    _id
    url
    formFields
  }
}
`;

  const variables = {
    blobsInfo,
    collectionId,
  };

  let getBlobUploadSignedUrl;
  try {
    const graphqlResult = await graphQLClient.request(query, variables);
    getBlobUploadSignedUrl = graphqlResult.getBlobUploadSignedUrl;
  } catch (err) {
    throw new PluginError({
      message: err.message,
      statusCode: 400,
    });
  }

  const uploadedBlobsId = [];

  for (const uploadSignedUrl of getBlobUploadSignedUrl) {
    // 3__>> UploadIntoAWS
    const formData = new FormData();

    for (const [key, fieldValue] of Object.entries(uploadSignedUrl.formFields)) {
      formData.append(key, fieldValue);
    }

    formData.append('file', JSON.stringify(resultsJson));

    await formData.submit(uploadSignedUrl.url);

    uploadedBlobsId.push(uploadSignedUrl._id);
  }

  // 4__>> ReturnFilesIdInDatabase
  return uploadedBlobsId;
};

/**
 * UpdateCorrespondingItemFields
 * @param {InputData} body
 * @param {UpdateField} updateFields
 */
export const updateCorrespondingItemFields = async (body, updateFields) => {
  const statusUpdatedFieldName = body.config.statusField;

  if (statusUpdatedFieldName.split('.').length !== 1)
    throw new PluginError({
      message: `${statusUpdatedFieldName} should be in root of item object`,
      statusCode: 400,
    });

  const variables = {
    item: { _id: body.item._id, [statusUpdatedFieldName]: updateFields.status },
  };

  const graphQLClient = new GraphQLClient(`${body.orgDomain}/api/v1/graphql`, {
    headers: {
      authorization: `Bearer ${body.apiKey}`,
    },
  });

  if (has(updateFields, 'ocrResult')) {
    const resultUpdatedFieldName = body.config.resultField;

    if (resultUpdatedFieldName.split('.').length !== 1)
      throw new PluginError({
        message: `${resultUpdatedFieldName} should be in root of item object`,
        statusCode: 400,
      });

    const blobsId = await uploadJson({
      // TODO: Delete This line when plugin supports the ocr multi file for one item
      resultsJson: [updateFields.ocrResult],
      collectionId: last(body.item.ancestors),
      graphQLClient,
    });

    variables.item[resultUpdatedFieldName] = blobsId;
  }

  const schemaName =
    typeof body.item.schema === 'string' ? body.item.schema : body.item.schema.name;
  const updatedSchema = `update${pluralize(schemaName)}`;
  const updateItemSchema = `${upperFirst(updatedSchema)}_${upperFirst(schemaName)}Items`;

  // prettier-ignore
  const query = /* GraphQL */ `mutation($item: ${updateItemSchema}!) { ${updatedSchema}(items: [$item]) { _id } }`;

  await graphQLClient.request(query, variables);

  logger.info({ message: `The item with ${body.item._id} _id is updated successfully` });
};
