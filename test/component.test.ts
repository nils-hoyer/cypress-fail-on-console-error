import { describe, expect, it } from 'vitest';
import { failed, failedOnConsole, passed, useCypressRun } from './runCypress';

const secondErrorNotExcluded =
    'secondErrorNotExcluded 1 {"foo":"bar"} ["a",1] undefined null';

describe('Cypress components', () => {
    const { spec, unchecked } = useCypressRun('component');

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
                "TypeError: Cannot read properties of undefined (reading 'map')"
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
                'consoleWarnMessage'
            ),
            passed('should pass on console.info'),
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
                'errorNotExcluded'
            ),
            passed(
                'should pass AssertionError on console.error with addConsoleMessages'
            ),
            failedOnConsole(
                'should throw AssertionError on console.error with deleteConsoleMessages',
                'secondErrorExcluded'
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
