import failOnConsoleError, { consoleType } from '../../dist/index';
import './commands';

const config = {
    excludeMessages: ['firstError', 'secondError'],
    includeConsoleTypes: [consoleType.ERROR, consoleType.WARN],
};

failOnConsoleError(config);
