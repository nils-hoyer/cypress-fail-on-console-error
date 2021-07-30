import { expect } from 'chai';
import * as process from 'child_process';
import * as util from 'util';

const exec = util.promisify(process.exec);
const cypressRun = 'cypress run --browser chrome --headless';

describe('Cypress', () => {
    it('when console.error is called then cypress fails', async () => {
        const spec =
            ' --spec ./cypress/integration/shouldFailOnConsoleError.js';
        let testResult = '';

        try {
            await exec(cypressRun + spec);
        } catch (error) {
            testResult = error.stdout;
        } finally {
            // console.log(testResult);
            const expectedTestResult = '1 of 1 failed';
            const expectedError =
                "AssertionError: expected error to have been called exactly '0 times'";
            expect(testResult).contains(expectedTestResult);
            expect(testResult).contains(expectedError);
        }
    });

    it('when console.info is called then cypress passes', async () => {
        const spec = ' --spec ./cypress/integration/shouldPassOnConsoleInfo.js';

        const { stdout } = await exec(cypressRun + spec);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });

    it('when console.error with config excludeMessages matching console.error message then cypress passes', async () => {
        const spec =
            ' --spec ./cypress/integration/shouldPassOnConsoleErrorExcludeMessages.js';

        const { stdout } = await exec(cypressRun + spec);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });

    it('when config includeConsoleTypes ConsoleType.ERROR and ConsoleType.WARN then cypress fails with two errors ', async () => {
        const spec =
            ' --spec ./cypress/integration/shouldFailOnConsoleErrorAndConsoleWarn.js';
        let testResult = '';

        try {
            await exec(cypressRun + spec);
        } catch (error) {
            testResult = error.stdout;
        } finally {
            // console.log(testResult);
            const expectedTestResult = /1 of 1 failed.*3.*1.*2/;
            const expectedError =
                /AssertionError: expected (error|warn) to have been called exactly '0 times'/g;
            expect(testResult).to.match(expectedTestResult);
            expect(testResult.match(expectedError).length).to.be.equal(2);
        }
    });

    it('when run multiple tests files and tests cases then cypress run all files and test cases', async () => {
        const spec =
            ' --spec "cypress/integration/shouldRunAllTestsAlthoughConsoleError.js,cypress/integration/shouldRunAllTestsAlthoughConsoleError2.js"';
        let testResult = '';

        try {
            await exec(cypressRun + spec);
        } catch (error) {
            testResult = error.stdout;
        } finally {
            // console.log(testResult);
            const expectedTestResult = /2 of 2 failed.*6.*3.*3/;
            const expectedError =
                /AssertionError: expected error to have been called exactly '0 times'/g;
            expect(testResult).to.match(expectedTestResult);
            expect(testResult.match(expectedError).length).to.be.equal(3);
        }
    });
});
