import * as process from 'child_process';
import * as util from 'util';
import { describe, expect, it } from 'vitest';

const exec = util.promisify(process.exec);

async function runSpec(specPath: string): Promise<string> {
    try {
        return (
            await exec(
                `cypress run \
                --browser chrome \
                --component \
                --headless \
                --config-file ./cypress/cypress.config.ts \
                --spec ./cypress/component/${specPath}.cy.ts`
            )
        ).stdout;
    } catch (error: any) {
        // console.debug(error.stdout);
        return error.stdout;
    }
}

describe('Cypress components', () => {
    it('WHEN console.error is called THEN cypress fails', async () => {
        expect(await runSpec('shouldFailOnConsoleError'))
            .contains('1 of 1 failed')
            .and.contains(
                'secondErrorNotExcluded 1 {"foo":"bar"} ["a",1] undefined null'
            );
    });

    it('WHEN console.error from new Error() is called THEN cypress fails', async () => {
        expect(await runSpec('shouldFailOnConsoleErrorFromError'))
            .contains('1 of 1 failed')
            .and.contains(
                "TypeError: Cannot read properties of undefined (reading 'map')"
            );
    });

    it('WHEN console.info is called THEN cypress passes', async () => {
        expect(await runSpec('shouldPassOnConsoleInfo')).contains(
            'All specs passed'
        );
    });

    it('WHEN console.error with config excludeMessages matching console.error message THEN cypress passes', async () => {
        expect(
            await runSpec('shouldPassOnConsoleErrorExcludeMessages')
        ).contains('All specs passed');
    });

    it('WHEN run tests with setConfig THEN config will applied to test', async () => {
        expect(await runSpec('shouldFailOnConsoleErrorFromSetConfig'))
            .to.match(/Failing:.*2/)
            .and.match(/Passing:.*2/)
            .and.match(/Tests:.*4/);
    });

    it('WHEN run multiple tests files and tests cases THEN cypress runs all files and test cases', async () => {
        expect(await runSpec('shouldRunAllTestsAlthoughConsoleError*'))
            .to.match(/2 of 2 failed.*6.*3.*3/)
            .and.satisfies(
                (result: any) =>
                    result.match(
                        /AssertionError: cypress-fail-on-console-error:/g
                    )?.length === 3
            );
    });

    it('WHEN run multiple tests THEN spies will be resetted between tests', async () => {
        expect(await runSpec('shouldResetSpiesBetweenTests'))
            .to.match(/Failing:.*1/)
            .and.match(/Passing:.*1/)
            .and.match(/Tests:.*2/);
    });

    it('WHEN run multiple tests with cypress error THEN spies will be resetted between tests', async () => {
        expect(await runSpec('shouldResetSpiesBetweenTestsOnCypressFailure'))
            .to.match(/Failing:.*1/)
            .and.match(/Passing:.*1/)
            .and.match(/Tests:.*2/);
    });

    it('WHEN run multiple tests THEN config will be reset between tests', async () => {
        expect(await runSpec('shouldResetConfigBetweenTests'))
            .to.match(/Failing:.*1/)
            .and.match(/Passing:.*1/)
            .and.match(/Tests:.*2/);
    });
});
