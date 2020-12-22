import * as process from 'child_process';
import * as util from 'util';
import { expect } from 'chai';

const exec = util.promisify(process.exec);
const cypressRun = 'cypress run --browser chrome --headless';

describe('cypress integration', () => {
    it('cypress should fail on console.error', async () => {
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
                'expected error to have been called exactly "0 times", but it was called once';
            expect(testResult).contains(expectedTestResult);
            expect(testResult).contains(expectedError);
        }
    });

    it('cypress should pass on console.warn', async () => {
        const spec = ' --spec ./cypress/integration/shouldPassOnConsoleWarn.js';

        const { stdout } = await exec(cypressRun + spec);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });

    it('cypress should pass without failOnConsoleError config', async () => {
        const spec =
            ' --spec ./cypress/integration/shouldPassWithoutFailOnConsoleErrorConfig.js';
        const configFile =
            ' --config-file ./cypress/fixtures/cypressMissingConfig.json';

        const { stdout } = await exec(cypressRun + spec + configFile);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });

    it('cypress should pass with config exclude matching console.error message', async () => {
        const spec =
            ' --spec ./cypress/integration/shouldPassOnConsoleErrorExclude.js';
        const configFile =
            ' --config-file ./cypress/fixtures/cypressExclude.json';

        const { stdout } = await exec(cypressRun + spec + configFile);
        const testResult = stdout;

        // console.log(testResult);
        const expectedTestResult = 'All specs passed';
        expect(testResult).contains(expectedTestResult);
    });
});
