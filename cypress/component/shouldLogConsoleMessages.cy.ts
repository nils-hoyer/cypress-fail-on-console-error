import { WithError } from './customComponents';

const caughtLogs = (log: sinon.SinonSpy) =>
    log
        .getCalls()
        .map((call) => call.args[0])
        .filter((options) => /^console\./.test(options?.name ?? ''))
        .map((options) => ({
            message: options.message,
            consoleProps: options.consoleProps(),
        }));

describe('shouldLogConsoleMessages', () => {
    it('should log each caught console message to the command log', () => {
        // log(false): the spy would log its own calls through Cypress.log
        const log = cy.spy(Cypress, 'log').log(false);
        cy.on('fail', (error) => {
            expect(error.message).to.contain('secondErrorNotExcluded');
            // firstErrorExcluded is excluded, so it is not logged
            expect(caughtLogs(log)).to.deep.equal([
                {
                    message:
                        'secondErrorNotExcluded 1 {"foo":"bar"} ["a",1] undefined null',
                    consoleProps: {
                        'Console method': 'console.error',
                        Arguments: [
                            'secondErrorNotExcluded',
                            1,
                            { foo: 'bar' },
                            ['a', 1],
                            undefined,
                            null,
                        ],
                    },
                },
            ]);
        });
        cy.mount(WithError, 'with-error');
        cy.then(() => {
            throw new Error('expected the console error to fail the test');
        });
    });
});
