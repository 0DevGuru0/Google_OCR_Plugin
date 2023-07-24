import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  // TODO: make defaultMeta to generic
  defaultMeta: { service: 'Google-OCR-Plugin' },
});

logger.add(
  new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  })
);
export default logger;
