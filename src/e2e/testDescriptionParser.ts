import { createLogger } from 'src/utils/Logger';

const logger = createLogger({ prefix: 'TestDescriptionParser' });

export const parseTestDescription = (description: string) => {
  logger.info('Parsing test description:', description);
  return description;
};
