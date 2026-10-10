import { WithError } from './customComponents';

const caughtLogs = (log: sinon.SinonSpy) =>
    log
        .getCalls()
        .map((call) => call.args[0])
        .filter((options) => /^(console\.|ignored$)/.test(options?.name ?? ''))
        .map((options) => ({
            name: options.name,
            message: options.message,
            consoleProps: options.consoleProps(),
        }));

describe('shouldLogConsoleMessages', () => {
    it('should log each caught console message, and with debug each ignored one, to the command log', () => {
        // log(false): the spy would log its own calls through Cypress.log
        const log = cy.spy(Cypress, 'log').log(false);
        cy.on('fail', (error) => {
            expect(error.message).to.contain('secondErrorNotExcluded');
            // firstErrorExcluded is ignored, and the support file sets debug: true
            expect(caughtLogs(log)).to.deep.equal([
                {
                    name: 'ignored',
                    message:
                        '**/firstErrorExcluded.\\*/** matched console.error: firstErrorExcluded',
                    consoleProps: {
                        'Console method': 'console.error',
                        Arguments: ['firstErrorExcluded'],
                        'Ignored by': /firstErrorExcluded.*/,
                    },
                },
                {
                    name: 'console.error',
                    message:
                        'secondErrorNotExcluded 1 {"foo":"bar"} \\["a",1\\] undefined null',
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
