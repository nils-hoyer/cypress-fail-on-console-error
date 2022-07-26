import failOnConsoleError, { consoleType } from '../../dist/index';
import './commands';

const config = {
    excludeMessages: [
        /firstErrorExcluded.*/,
        'secondErrorExcluded',
        'thirdErrorExcluded.*consoleError.*',
    ],
    includeConsoleTypes: [consoleType.ERROR, consoleType.WARN],
    cypressLog: true,
};

failOnConsoleError(config);
