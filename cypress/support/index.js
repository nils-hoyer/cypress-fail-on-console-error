import failOnConsoleError, { consoleType } from '../../dist/index';
import './commands';

const config = {
    excludeMessages: ['firstErrorExcluded', 'secondErrorExcluded'],
    includeConsoleTypes: [consoleType.ERROR, consoleType.WARN],
};

failOnConsoleError(config);
