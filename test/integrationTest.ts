import { expect } from 'chai';
import * as process from 'child_process';
import * as util from 'util';

const exec = util.promisify(process.exec);
const cypressRun =
    'cypress run --browser chrome --headless --config-file ./cypress/cypress.config.ts';

describe('Cypress', () => {
    it('WHEN console.error is called THEN cypress fails', async () => {
        const spec = ' --spec ./cypress/e2e/shouldFailOnConsoleError.cy.ts';
        let testResult = '';

        try {
            await exec(cypressRun + spec);
        } catch (error: any) {
            testResult = error.stdout;
        } finally {
            // console.log(testResult);
            const expectedTestResult = '1 of 1 failed';
            const expectedErrorMessage =
                'secondErrorNotExcluded 1 {"foo":"bar"} ["a",1] undefined null';
            expect(testResult).contains(expectedTestResult);
            expect(testResult).contains(expectedErrorMessage);
        }
    });

    it('WHEN console.error from new Error() is called THEN cypress fails', async () => {
        const spec =
            ' --spec ./cypress/e2e/shouldFailOnConsoleErrorFromError.cy.ts';
        let testResult = '';

        try {
            await exec(cypressRun + spec);
        } catch (error: any) {
            testResult = error.stdout;
        } finally {
            // console.log(testResult);
            const expectedTestResult = '1 of 1 failed';
            const expectedErrorMessage =
                "TypeError: Cannot read properties of undefined (reading 'map')";
            expect(testResult).contains(expectedTestResult);
            expect(testResult).contains(expectedErrorMessage);
        }
    });

    it('WHEN console.info is called THEN cypress passes', async () => {
        const spec = ' --spec ./cypress/e2e/shouldPassOnConsoleInfo.cy.ts';

        const { stdout } = await exec(cypressRun + spec);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });

    it('WHEN console.error with config excludeMessages matching console.error message THEN cypress passes', async () => {
        const spec =
            ' --spec ./cypress/e2e/shouldPassOnConsoleErrorExcludeMessages.cy.ts';

        const { stdout } = await exec(cypressRun + spec);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });

    it('WHEN run multiple tests files and tests cases THEN cypress run all files and test cases', async () => {
        const spec =
            ' --spec "cypress/e2e/shouldRunAllTestsAlthoughConsoleError.cy.ts,cypress/e2e/shouldRunAllTestsAlthoughConsoleError2.cy.ts"';
        let testResult = '';

        try {
            await exec(cypressRun + spec);
        } catch (error: any) {
            testResult = error.stdout;
        } finally {
            // console.log(testResult);
            const expectedTestResult = /2 of 2 failed.*6.*3.*3/;
            const expectedAssertionMessage =
                /AssertionError: cypress-fail-on-console-error:/g;
            expect(testResult).to.match(expectedTestResult);
            expect(
                testResult.match(expectedAssertionMessage)?.length
            ).to.be.equal(3);
        }
    });

    it('WHEN run multiple tests THEN spies will be resetted between tests', async () => {
        const spec = ' --spec ./cypress/e2e/shouldResetSpiesBetweenTests.cy.ts';
        let testResult = '';

        try {
            await exec(cypressRun + spec);
        } catch (error: any) {
            testResult = error.stdout;
        } finally {
            // console.log(testResult);
            //TODO: on the pipeline it should be checked with 31m -> /Failing:.*31m1/
            const expectedTestResultFailing = /Failing:.*1/;
            const expectedTestResultPassing = /Passing:.*1/;
            const expectedTestResultTests = /Tests:.*2/;
            expect(testResult).to.match(expectedTestResultFailing);
            expect(testResult).to.match(expectedTestResultPassing);
            expect(testResult).to.match(expectedTestResultTests);
        }
    });
});
