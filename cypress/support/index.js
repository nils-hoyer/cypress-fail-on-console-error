import './commands';
import failOnConsoleError, { consoleType } from '../../dist/index';

const config = {
    excludeMessages: ['excludeErrorMessage', 'foo'],
    includeConsoleTypes: [consoleType.ERROR, consoleType.WARN],
};

failOnConsoleError(config);
