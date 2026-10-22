describe('shouldAllowSpiesOnConsole', () => {
    it('should pass with cy.spy on console.error in onBeforeLoad', () => {
        cy.visit('./cypress/fixtures/consoleErrorExcludeMessage.html', {
            onBeforeLoad: (win) => {
                cy.spy(win.console, 'error').as('consoleError');
            },
        });
        cy.get('@consoleError').should(
            'have.been.calledWith',
            'secondErrorExcluded'
        );
    });

    it('should throw AssertionError on console.error with cy.spy in onBeforeLoad', () => {
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html', {
            onBeforeLoad: (win) => {
                cy.spy(win.console, 'error');
            },
        });
    });

    it('should pass with cy.stub on console.error in onBeforeLoad', () => {
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html', {
            onBeforeLoad: (win) => {
                cy.stub(win.console, 'error').as('consoleError');
            },
        });
        cy.get('@consoleError').should(
            'have.been.calledWith',
            'errorNotExcluded'
        );
    });

    it('should pass with cy.spy on console.error after cy.visit', () => {
        cy.visit('./cypress/fixtures/noConsole.html');
        cy.window().then((win) => {
            cy.spy(win.console, 'error').as('consoleError');
            win.console.error('secondErrorExcluded');
        });
        cy.get('@consoleError').should('have.been.calledOnce');
    });

    it('should throw AssertionError on console.error with cy.spy after cy.visit', () => {
        cy.visit('./cypress/fixtures/noConsole.html');
        cy.window().then((win) => {
            cy.spy(win.console, 'error');
            win.console.error('errorNotExcluded');
        });
    });
});
