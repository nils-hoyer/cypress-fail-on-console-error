import { WithErrorNotExcluded, WithExcludedError } from './customComponents';

describe('shouldFailOnConsoleErrorFromSetConfig', () => {
    it('should pass with getConsoleMessages', () => {
        cy.getConsoleMessages().then((consoleMessages) => {
            expect(consoleMessages).deep.equal([
                /firstErrorExcluded.*/,
                'secondErrorExcluded',
                'thirdErrorExcluded.*consoleError.*',
            ]);
        });
    });

    it('should throw AssertionError on console.error with setConsoleMessages', () => {
        cy.setConsoleMessages([]);
        cy.getConsoleMessages().then((consoleMessages) => {
            expect(consoleMessages).deep.equal([]);
        });
        cy.mount(WithErrorNotExcluded, 'with-not-excluded');
    });

    it('should pass AssertionError on console.error with addConsoleMessages', () => {
        cy.addConsoleMessages(['errorNotExcluded']);
        cy.getConsoleMessages().then((consoleMessages) => {
            expect(consoleMessages).includes('errorNotExcluded');
        });
        cy.mount(WithErrorNotExcluded, 'with-not-excluded');
    });

    it('should throw AssertionError on console.error with deleteConsoleMessages', () => {
        cy.deleteConsoleMessages(['secondErrorExcluded']);
        cy.getConsoleMessages().then((consoleMessages) => {
            expect(consoleMessages).not.includes('errorNotExcluded');
            expect(consoleMessages).to.have.length(3);
        });
        cy.mount(WithExcludedError, 'with-excluded-error');
    });
});
