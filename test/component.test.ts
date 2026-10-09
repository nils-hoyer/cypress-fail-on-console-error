import { describe, expect, it } from 'vitest';
import { failed, failedOnConsole, passed, useCypressRun } from './runCypress';

const secondErrorNotExcluded =
    'console.error: secondErrorNotExcluded 1 {"foo":"bar"} ["a",1] undefined null';

describe('Cypress components', () => {
    const { spec, unchecked } = useCypressRun('component');

    it('WHEN console type is changed with setConfig THEN cypress fails on that type only', () => {
        expect(spec('shouldFailOnConsoleMatch')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error',
                'console.error: consoleErrorMessage'
            ),
            failedOnConsole(
                'should throw AssertionError on console.warn',
                'console.warn: consoleWarnMessage'
            ),
            failedOnConsole(
                'should throw AssertionError on console.info',
                'console.info: consoleInfoMessage'
            ),
            failedOnConsole(
                'should throw AssertionError on console.debug',
                'console.debug: consoleDebugMessage'
            ),
            failedOnConsole(
                'should throw AssertionError on console.trace',
                'console.trace: consoleTraceMessage'
            ),
            failedOnConsole(
                'should throw AssertionError on console.table',
                'console.table: consoleTableMessage'
            ),
            failedOnConsole(
                'should throw AssertionError on console.log',
                'console.log: consoleLogMessage'
            ),
            failedOnConsole(
                'should throw AssertionError on a failed console.assert',
                'console.assert: Assertion failed: consoleAssertMessage'
            ),
        ]);
    });

    it('WHEN console.error is called THEN cypress fails', () => {
        expect(spec('shouldFailOnConsoleError')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error',
                secondErrorNotExcluded
            ),
        ]);
    });

    it('WHEN console.error from new Error() is called THEN cypress fails', () => {
        expect(spec('shouldFailOnConsoleErrorFromError')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error from new error',
                "console.error: TypeError: Cannot read properties of undefined (reading 'map')"
            ),
        ]);
    });

    it('WHEN console.error and console.warn are watched THEN cypress fails on both', () => {
        expect(spec('shouldFailOnConsoleErrorAndConsoleWarn')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error',
                secondErrorNotExcluded
            ),
            failedOnConsole(
                'should throw AssertionError on console.warn',
                'console.warn: consoleWarnMessage'
            ),
            passed('should pass on console.info'),
        ]);
    });

    it('WHEN several console messages are not excluded THEN cypress fails listing all of them', () => {
        expect(spec('shouldFailOnAllConsoleMessages')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError listing every console message that is not excluded',
                'console.error: errorNotExcluded',
                'console.warn: consoleWarnMessage'
            ),
        ]);
    });

    it('WHEN console messages are caught THEN log each to the command log with its arguments', () => {
        expect(spec('shouldLogConsoleMessages')).to.deep.equal([
            passed('should log each caught console message to the command log'),
        ]);
    });

    it('WHEN consoleMessages has { type, message } patterns THEN cypress ignores the message only for that console method', () => {
        expect(spec('shouldFailOnConsoleMessagesOfType')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error when only console.warn is excluded',
                'console.error: sameMessage'
            ),
            passed(
                'should pass when the message is excluded for both console methods'
            ),
        ]);
    });

    it('WHEN includeConsoleMessages is set THEN cypress fails only on matching console messages', () => {
        expect(spec('shouldFailOnIncludedConsoleMessages')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError only on included console messages that are not excluded',
                'console.error: errorNotExcluded'
            ),
            passed('should pass when no console message is included'),
            failedOnConsole(
                'should throw AssertionError only on included console messages of a console method',
                'console.warn: sameMessage'
            ),
        ]);
    });

    it('WHEN console.info is called THEN cypress passes', () => {
        expect(spec('shouldPassOnConsoleInfo')).to.deep.equal([
            passed('should pass on console.info'),
        ]);
    });

    it('WHEN console.error with config excludeMessages matching console.error message THEN cypress passes', () => {
        expect(spec('shouldPassOnConsoleErrorExcludeMessages')).to.deep.equal([
            passed(
                'should pass on exclude message matching console.error message'
            ),
        ]);
    });

    it('WHEN run tests with setConfig THEN config will applied to test', () => {
        expect(spec('shouldFailOnConsoleErrorFromSetConfig')).to.deep.equal([
            passed('should pass with getConsoleMessages'),
            failedOnConsole(
                'should throw AssertionError on console.error with setConsoleMessages',
                'console.error: errorNotExcluded'
            ),
            passed(
                'should pass AssertionError on console.error with addConsoleMessages'
            ),
            failedOnConsole(
                'should throw AssertionError on console.error with deleteConsoleMessages',
                'console.error: secondErrorExcluded'
            ),
        ]);
    });

    it('WHEN run multiple tests files and tests cases THEN cypress runs all files and test cases', () => {
        expect(spec('shouldRunAllTestsAlthoughConsoleError')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error',
                secondErrorNotExcluded
            ),
            passed('should pass on console.info'),
            failedOnConsole(
                'should throw AssertionError on console.error',
                secondErrorNotExcluded
            ),
        ]);
        expect(spec('shouldRunAllTestsAlthoughConsoleError2')).to.deep.equal([
            passed('should pass on console.info'),
            failedOnConsole(
                'should throw AssertionError on console.error',
                secondErrorNotExcluded
            ),
            passed('should pass on console.info'),
        ]);
    });

    it('WHEN run multiple tests THEN spies will be resetted between tests', () => {
        expect(spec('shouldResetSpiesBetweenTests')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error',
                secondErrorNotExcluded
            ),
            passed('should pass on error excluded message'),
        ]);
    });

    it('WHEN run multiple tests with cypress error THEN spies will be resetted between tests', () => {
        expect(
            spec('shouldResetSpiesBetweenTestsOnCypressFailure')
        ).to.deep.equal([
            failed(
                'should throw cypress error',
                'AssertionError: Timed out retrying after 2000ms: Expected to find element: `.notExisting`, but never found it.'
            ),
            passed('should pass with no console error'),
        ]);
    });

    it('WHEN run multiple tests THEN config will be reset between tests', () => {
        expect(spec('shouldResetConfigBetweenTests')).to.deep.equal([
            passed('should pass AssertionError on console.error'),
            failedOnConsole(
                'should throw AssertionError on console.error',
                secondErrorNotExcluded
            ),
        ]);
    });

    it('WHEN all specs ran THEN each spec is checked by a test above', () => {
        expect(unchecked()).to.deep.equal([]);
    });
});
