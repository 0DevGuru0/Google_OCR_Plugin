import {
  isEmpty,
  has,
  get
} from 'lodash';
import {
  isUri
} from 'valid-url';
import {
  PluginError
} from './helpers';
import {
  checkBlobIsInProgress
} from './checkBlobIsInProgress';
import {
  Status
} from './Status.enum';

/**
 * @param {InputData} inputData
 * @returns {string}
 */

export default async ({
  config,
  item,
  orgDomain,
  apiKey
}) => {
  const statusFieldValue = get(item, config.statusField);
  if (!isEmpty(statusFieldValue) && statusFieldValue !== Status.READY) {
    // TODO: Change the PluginError to PluginResponse that includes both Error and Non-Error responses
    throw new PluginError({
      message: 'ocrStatus is not Ready to start Plugin',
      statusCode: 102
    });
  }

  const pdf = get(item, config.pdfField);

  if (!has(pdf, '_id')) throw new PluginError({
    message: "can'\t find pdf id",
    statusCode: 404
  });

  if (!orgDomain) throw new PluginError({
    message: 'please enter file path.',
    statusCode: 400
  });

  if (!apiKey) throw new PluginError({
    message: 'please enter apiKey.',
    statusCode: 400
  });

  if (!isUri(orgDomain))
    throw new PluginError({
      message: 'please enter valid file path.',
      statusCode: 400
    });

  await checkBlobIsInProgress(pdf._id);
};