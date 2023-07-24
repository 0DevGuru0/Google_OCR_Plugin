import deleteFileFromGCS from './deleteFileFromGCS';

export const removeOCRStaleFiles = async (metadataFile, metadataFileContainer) => {
  //  Delete OcrResult File From GCS
  await deleteFileFromGCS(metadataFile.ocrData.destinationUri, true);

  // Delete PDF File From GCS
  metadataFile.ocrData.fileUrl = metadataFile.ocrData.fileUrl.replace(
    `gs://${metadataFile.ocrData.bucketName}/`,
    ''
  );
  await deleteFileFromGCS(metadataFile.ocrData.fileUrl, false);

  //  Delete Metadata File From GCS
  await metadataFileContainer.delete();
};
