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
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
    });

    it('should pass AssertionError on console.error with addIgnoredConsoleMessages', () => {
        cy.addIgnoredConsoleMessages(['errorNotExcluded']);
        cy.getIgnoredConsoleMessages().then((ignoreConsoleMessages) => {
            expect(ignoreConsoleMessages).includes('errorNotExcluded');
        });
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
    });

    it('should throw AssertionError on console.error with deleteIgnoredConsoleMessages', () => {
        cy.deleteIgnoredConsoleMessages(['secondErrorExcluded']);
        cy.getIgnoredConsoleMessages().then((ignoreConsoleMessages) => {
            expect(ignoreConsoleMessages).not.includes('secondErrorExcluded');
            expect(ignoreConsoleMessages).to.have.length(2);
        });
        cy.visit('./cypress/fixtures/consoleErrorExcludeMessage.html');
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
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
    });
});
