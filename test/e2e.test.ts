import { describe, expect, it } from 'vitest';
import {
    failed,
    failedInAfterHook,
    failedOnConsole,
    passed,
    skipped,
    useCypressRun,
} from './runCypress';

const secondErrorNotExcluded =
    'console.error: secondErrorNotExcluded 1 {"foo":"bar"} ["a",1] undefined null';

describe('Cypress e2e', () => {
    const { spec, unchecked } = useCypressRun('e2e');

    it('WHEN console type is matched THEN cypress fails', () => {
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
        expect(spec('shouldFailOnConsoleErrorFromConfigFile')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error from config file with exclude',
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
            passed(
                'should log each caught console message, and with debug each ignored one, to the command log'
            ),
        ]);
    });

    it('WHEN ignoreConsoleMessages has { type, message } patterns THEN cypress ignores the message only for that console method', () => {
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

    it('WHEN the console message has format specifiers THEN they are filled in before matching', () => {
        expect(spec('shouldFailOnFormattedConsoleMessage')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError with the format specifiers filled in',
                'console.error: Warning: componentWillMount is deprecated, use componentDidMount instead.'
            ),
            passed('should pass when the filled in message is ignored'),
            failedOnConsole(
                'should throw AssertionError with %%, DOM elements, Maps and Sets as the browser shows them',
                'console.error: Upload: 100% done <div id="app" class="list"> Map(1) {"user":42} Set(1) ["a"]'
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
            passed('should pass with getIgnoredConsoleMessages'),
            failedOnConsole(
                'should throw AssertionError on console.error with setIgnoredConsoleMessages',
                'console.error: errorNotExcluded'
            ),
            passed(
                'should pass AssertionError on console.error with addIgnoredConsoleMessages'
            ),
            failedOnConsole(
                'should throw AssertionError on console.error with deleteIgnoredConsoleMessages',
                'console.error: secondErrorExcluded'
            ),
            passed(
                'should pass with deleteIgnoredConsoleMessages for a RegExp'
            ),
            failed(
                'should throw an Error on the renamed consoleMessages option',
                'Error: cypress-fail-on-console-error: consoleMessages was renamed to ignoreConsoleMessages'
            ),
            failed(
                'should throw an Error when addIgnoredConsoleMessages gets a string',
                'Error: cypress-fail-on-console-error: cy.addIgnoredConsoleMessages() expects an array, got string'
            ),
            failed(
                'should throw an Error when deleteIgnoredConsoleMessages gets a string',
                'Error: cypress-fail-on-console-error: cy.deleteIgnoredConsoleMessages() expects an array, got string'
            ),
            failed(
                'should throw an Error when failOnConsoleError is called twice',
                'Error: cypress-fail-on-console-error: failOnConsoleError() was called more than once. Call it once, in your support file.'
            ),
        ]);
    });

    it('WHEN run multiple tests files and tests cases THEN cypress run all files and test cases', () => {
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

    it('WHEN run multiple tests with cypress eror THEN spies will be resetted between tests', () => {
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

    it('WHEN run multiple tests THEN config will be resetted between tests', () => {
        expect(spec('shouldResetConfigBetweenTests')).to.deep.equal([
            passed('should pass AssertionError on console.error'),
            failedOnConsole(
                'should throw AssertionError on console.error',
                secondErrorNotExcluded
            ),
        ]);
    });

    it('WHEN console.error is called after the last command THEN the next check fails and names the test that logged it', () => {
        const lastTest =
            'should throw AssertionError in the after hook on console.error after the last command of the last test';
        expect(spec('shouldFailOnConsoleErrorAfterLastCommand')).to.deep.equal([
            passed('should pass on console.error after the last command'),
            failedOnConsole(
                'should throw AssertionError on console.error logged after the previous test ended',
                'logged after the test "should pass on console.error after the last command" ended:',
                'console.error: errorAfterLoad'
            ),
            failedOnConsole(
                'should throw AssertionError on console.error when a command waits for it',
                'console.error: errorAfterLoad'
            ),
            failedInAfterHook(
                failedOnConsole(
                    lastTest,
                    `logged after the test "${lastTest}" ended:`,
                    'console.error: errorAfterLoad'
                )
            ),
        ]);
    });

    it('WHEN tests share the page without test isolation THEN console.error after the last command fails the next test and names the test that logged it', () => {
        expect(
            spec('shouldFailOnConsoleErrorWithoutTestIsolation')
        ).to.deep.equal([
            passed('should pass on console.error after the last command'),
            failedOnConsole(
                'should throw AssertionError on console.error logged after the previous test ended',
                'logged after the test "should pass on console.error after the last command" ended:',
                'console.error: errorAfterLoad'
            ),
            passed('should pass on the same page without console.error'),
        ]);
    });

    it('WHEN cy.spy or cy.stub wrap console.error THEN they work, a spy calls through and a stub silences the message', () => {
        expect(spec('shouldAllowSpiesOnConsole')).to.deep.equal([
            passed('should pass with cy.spy on console.error in onBeforeLoad'),
            failedOnConsole(
                'should throw AssertionError on console.error with cy.spy in onBeforeLoad',
                'console.error: errorNotExcluded'
            ),
            passed('should pass with cy.stub on console.error in onBeforeLoad'),
            passed('should pass with cy.spy on console.error after cy.visit'),
            failedOnConsole(
                'should throw AssertionError on console.error with cy.spy after cy.visit',
                'console.error: errorNotExcluded'
            ),
        ]);
    });

    it('WHEN the page logs console.error and navigates during a command THEN cypress fails', () => {
        expect(spec('shouldFailOnConsoleErrorBeforeNavigation')).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError on console.error before a redirect',
                'console.error: errorBeforeRedirect'
            ),
            failedOnConsole(
                'should throw AssertionError on console.error when the page unloads',
                'console.error: errorOnPagehide'
            ),
        ]);
    });

    it('WHEN the app logs a failed request THEN cypress fails unless the test ignores it', () => {
        expect(
            spec('shouldFailOnConsoleErrorAfterFailedRequest')
        ).to.deep.equal([
            failedOnConsole(
                'should throw AssertionError when the app logs a failed request',
                'console.error: Failed to load user {"id":42,"status":500}'
            ),
            passed('should pass when the test ignores the failed request'),
            passed('should pass when the request succeeds'),
        ]);
    });

    it('WHEN console.error is called during cy.visit in a beforeEach hook THEN the hook fails and the remaining tests are skipped', () => {
        expect(spec('shouldFailOnConsoleErrorInBeforeEachHook')).to.deep.equal([
            failed(
                'should throw AssertionError on console.error in the beforeEach hook',
                'AssertionError: cypress-fail-on-console-error:\nconsole.error: errorNotExcluded\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `shouldFailOnConsoleErrorInB...`'
            ),
            skipped('should be skipped after the failed beforeEach hook'),
        ]);
    });

    it('WHEN tests are retried THEN a retry without console.error passes and a failed attempt does not affect the next test', () => {
        expect(spec('shouldFailOnConsoleErrorWithRetries')).to.deep.equal([
            passed('should pass when the retry has no console.error'),
            failedOnConsole(
                'should throw AssertionError when every attempt logs console.error',
                'console.error: errorNotExcluded'
            ),
            passed('should pass after a test that failed every attempt'),
        ]);
    });

    it('WHEN console.error is called in an iframe THEN cypress passes, and the page is still watched', () => {
        expect(spec('shouldPassOnConsoleErrorInIframe')).to.deep.equal([
            passed('should pass on console.error in a same-origin iframe'),
            failedOnConsole(
                'should still throw AssertionError on console.error of the page after the iframe loaded',
                'console.error: errorNotExcluded'
            ),
        ]);
    });

    it('WHEN all specs ran THEN each spec is checked by a test above', () => {
        expect(unchecked()).to.deep.equal([]);
    });
});
