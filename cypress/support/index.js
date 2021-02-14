import './commands';
import failOnConsoleError, { consoleType } from '../../dist/index';

const config = {
    excludeMessages: ['firstError', 'secondError'],
    includeConsoleTypes: [consoleType.ERROR, consoleType.WARN],
};

failOnConsoleError(config);
