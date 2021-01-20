import './commands';
import failOnConsoleError from '../../dist/index';
import { ConsoleType } from '../../dist/types/ConsoleType';

const config = {
    excludeMessages: ['excludeErrorMessage', 'foo'],
    includeConsoleTypes: [ConsoleType.ERROR, ConsoleType.WARN],
};

failOnConsoleError(config);
