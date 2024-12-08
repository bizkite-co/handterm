import { createLogger } from 'src/utils/Logger';

const _describe = () => {};
const _it = () => {};
const _expect = () => {};

const logger = createLogger({ prefix: 'TestDescriptionParser' });

export const parseTestDescription = (description: string) => {
  logger.info('Parsing test description:', description);
  return description;
};
