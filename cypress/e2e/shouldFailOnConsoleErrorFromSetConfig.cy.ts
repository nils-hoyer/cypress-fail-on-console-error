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
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
    });

    it('should pass AssertionError on console.error with addConsoleMessages', () => {
        cy.addConsoleMessages(['errorNotExcluded']);
        cy.getConsoleMessages().then((consoleMessages) => {
            expect(consoleMessages).includes('errorNotExcluded');
        });
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
    });

    it('should throw AssertionError on console.error with deleteConsoleMessages', () => {
        cy.deleteConsoleMessages(['secondErrorExcluded']);
        cy.getConsoleMessages().then((consoleMessages) => {
            expect(consoleMessages).not.includes('secondErrorExcluded');
            expect(consoleMessages).to.have.length(2);
        });
        cy.visit('./cypress/fixtures/consoleErrorExcludeMessage.html');
    });

    it('should pass with deleteConsoleMessages for a RegExp', () => {
        cy.deleteConsoleMessages([/firstErrorExcluded.*/]);
        cy.getConsoleMessages().then((consoleMessages) => {
            expect(consoleMessages).deep.equal([
                'secondErrorExcluded',
                'thirdErrorExcluded.*consoleError.*',
            ]);
        });
    });
});
