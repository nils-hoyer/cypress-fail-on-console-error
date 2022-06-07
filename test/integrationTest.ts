import { expect } from 'chai';
import * as process from 'child_process';
import * as util from 'util';

const exec = util.promisify(process.exec);
const cypressRun = 'cypress run --browser chrome --headless';

describe('Cypress', () => {
    it('WHEN console.error is called THEN cypress fails', async () => {
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
            const expectedAssertionMessage =
                'AssertionError: console match found';
            const expectedErrorMessage =
                'secondErrorNotExcluded 1 {"foo":"bar"} ["a",1] undefined null';
            expect(testResult).contains(expectedTestResult);
            expect(testResult).contains(expectedAssertionMessage);
            expect(testResult).contains(expectedErrorMessage);
        }
    });

    it('WHEN console.error from new Error() is called THEN cypress fails', async () => {
        const spec =
            ' --spec ./cypress/integration/shouldFailOnConsoleErrorFromError.js';
        let testResult = '';

        try {
            await exec(cypressRun + spec);
        } catch (error) {
            testResult = error.stdout;
        } finally {
            // console.log(testResult);
            const expectedTestResult = '1 of 1 failed';
            const expectedAssertionMessage =
                'AssertionError: console match found';
            const expectedErrorMessage =
                "TypeError: Cannot read properties of undefined (reading \\'map\\')";
            expect(testResult).contains(expectedTestResult);
            expect(testResult).contains(expectedAssertionMessage);
            expect(testResult).contains(expectedErrorMessage);
        }
    });

    it('WHEN console.info is called THEN cypress passes', async () => {
        const spec = ' --spec ./cypress/integration/shouldPassOnConsoleInfo.js';

        const { stdout } = await exec(cypressRun + spec);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });

    it('WHEN console.error with config excludeMessages matching console.error message THEN cypress passes', async () => {
        const spec =
            ' --spec ./cypress/integration/shouldPassOnConsoleErrorExcludeMessages.js';

        const { stdout } = await exec(cypressRun + spec);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });

    it('WHEN run multiple tests files and tests cases THEN cypress run all files and test cases', async () => {
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
            const expectedAssertionMessage =
                /AssertionError: console match found/g;
            expect(testResult).to.match(expectedTestResult);
            expect(
                testResult.match(expectedAssertionMessage).length
            ).to.be.equal(3);
        }
    });
});
