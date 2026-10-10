import { WithErrorNotExcluded, WithExcludedError } from './customComponents';

describe('shouldFailOnConsoleErrorFromSetConfig', () => {
    it('should pass with getIgnoredConsoleMessages', () => {
        cy.getIgnoredConsoleMessages().then((ignoreConsoleMessages) => {
            expect(ignoreConsoleMessages).deep.equal([
                /firstErrorExcluded.*/,
                'secondErrorExcluded',
                'thirdErrorExcluded.*consoleError.*',
            ]);
        });
    });

    it('should throw AssertionError on console.error with setIgnoredConsoleMessages', () => {
        cy.setIgnoredConsoleMessages([]);
        cy.getIgnoredConsoleMessages().then((ignoreConsoleMessages) => {
            expect(ignoreConsoleMessages).deep.equal([]);
        });
        cy.mount(WithErrorNotExcluded, 'with-not-excluded');
    });

    it('should pass AssertionError on console.error with addIgnoredConsoleMessages', () => {
        cy.addIgnoredConsoleMessages(['errorNotExcluded']);
        cy.getIgnoredConsoleMessages().then((ignoreConsoleMessages) => {
            expect(ignoreConsoleMessages).includes('errorNotExcluded');
        });
        cy.mount(WithErrorNotExcluded, 'with-not-excluded');
    });

    it('should throw AssertionError on console.error with deleteIgnoredConsoleMessages', () => {
        cy.deleteIgnoredConsoleMessages(['secondErrorExcluded']);
        cy.getIgnoredConsoleMessages().then((ignoreConsoleMessages) => {
            expect(ignoreConsoleMessages).not.includes('secondErrorExcluded');
            expect(ignoreConsoleMessages).to.have.length(2);
        });
        cy.mount(WithExcludedError, 'with-excluded-error');
    });

    it('should pass with deleteIgnoredConsoleMessages for a RegExp', () => {
        cy.deleteIgnoredConsoleMessages([/firstErrorExcluded.*/]);
        cy.getIgnoredConsoleMessages().then((ignoreConsoleMessages) => {
            expect(ignoreConsoleMessages).deep.equal([
                'secondErrorExcluded',
                'thirdErrorExcluded.*consoleError.*',
            ]);
        });
    });

    it('should pass with the deprecated consoleMessages from getConfig', () => {
        cy.getConfig().then((config) =>
            cy.setConfig({
                ...config,
                consoleMessages: [
                    ...config.consoleMessages,
                    'errorNotExcluded',
                ],
            })
        );
        cy.mount(WithErrorNotExcluded, 'with-not-excluded');
    });
});
