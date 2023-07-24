import { Storage } from '@google-cloud/storage';
import { pick, flatten ,sortBy} from 'lodash';

const breaks = {
  SPACE: 'SPACE',
  SURE_SPACE: 'SURE_SPACE',
  EOL_SURE_SPACE: 'EOL_SURE_SPACE',
  LINE_BREAK: 'LINE_BREAK',
};

const extractText = (paragraph) => {
  let text = '';
  let line = '';
  for (const words of paragraph.words) {
    for (const symbol of words.symbols) {
      line += symbol.text;
      switch (symbol.property?.detectedBreak?.type) {
        case breaks.SPACE:
          line += ' ';
          break;
        case breaks.SURE_SPACE:
          line += '   ';
          break;
        case breaks.EOL_SURE_SPACE:
          line += ' ';
          text += line;
          line = '';
          break;
        case breaks.LINE_BREAK:
          line += '\n';
          text += line;
          line = '';
          break;
        default:
          break;
      }
    }
  }
  return {
    text,
    boundingBox: paragraph.boundingBox,
  };
};

const collectProperties = (ocrResultFile) => {
  const ocrResults = [];

  // eslint-disable-next-line consistent-return
  ocrResultFile.forEach((ocrObj) => {
    const paragraphs = [];
    let pageDimension = {};
    if (!ocrObj?.fullTextAnnotation) {
      return;
    }


    for (const page of ocrObj.fullTextAnnotation.pages) {
      pageDimension = pick(page, ['width', 'height']);
      for (const block of page.blocks) {
        if (block.blockType !== 'TEXT') continue;
        for (const paragraph of block.paragraphs) {
          const { text, boundingBox } = extractText(paragraph);
          paragraphs.push({
            text,
            boundingBox,
          });
        }
      }

      ocrResults.push({
        text: ocrObj.fullTextAnnotation.text,
        page: {
          number: ocrObj.context.pageNumber,
          pageDimension,
        },
        paragraphs,
      });
    }

  });

  return ocrResults;
};

export const extractTextFromVisionApiResult = async (ocrMetadata) => {
  const bucketName = ocrMetadata.bucketName;

  const storage = new Storage({
    keyFilename: process.env.GOOGLE_SVC,
  });

  const bucket = storage.bucket(bucketName);
  const resultFilePath = ocrMetadata.destinationUri.replace(`${bucketName}/`, '');

  const [ocrResultFilesPath] = await bucket.getFiles({
    prefix: resultFilePath,
    autoPaginate: false,
  });

  const ocrResultParts = ocrResultFilesPath.map(async (ocrResultFilePath) => {
    const ocrResultFile = await bucket.file(ocrResultFilePath.name).download();
    const ocrResultFileContent = JSON.parse(ocrResultFile[0]).responses;
    return collectProperties(ocrResultFileContent);
  });

  const ocrResult = await Promise.all(ocrResultParts);
  
  const flatAllOcrResultChunks = flatten(ocrResult);

  const sortOcrResultByPageNumber = sortBy(flatAllOcrResultChunks, (o) => o.page.number)
  
  return sortOcrResultByPageNumber
};
