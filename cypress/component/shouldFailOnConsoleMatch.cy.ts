import { WithAllConsoleTypes } from './customComponents';

describe('shouldFailOnConsoleMatch', () => {
    it('should throw AssertionError on console.error', () => {
        cy.setConfig({ consoleTypes: ['error'] });
        cy.mount(WithAllConsoleTypes, 'with-all-console-types');
    });

    it('should throw AssertionError on console.warn', () => {
        cy.setConfig({ consoleTypes: ['warn'] });
        cy.mount(WithAllConsoleTypes, 'with-all-console-types');
    });

    it('should throw AssertionError on console.info', () => {
        cy.setConfig({ consoleTypes: ['info'] });
        cy.mount(WithAllConsoleTypes, 'with-all-console-types');
    });

    it('should throw AssertionError on console.debug', () => {
        cy.setConfig({ consoleTypes: ['debug'] });
        cy.mount(WithAllConsoleTypes, 'with-all-console-types');
    });

    it('should throw AssertionError on console.trace', () => {
        cy.setConfig({ consoleTypes: ['trace'] });
        cy.mount(WithAllConsoleTypes, 'with-all-console-types');
    });

    it('should throw AssertionError on console.table', () => {
        cy.setConfig({ consoleTypes: ['table'] });
        cy.mount(WithAllConsoleTypes, 'with-all-console-types');
    });

    it('should throw AssertionError on console.log', () => {
        cy.setConfig({ consoleTypes: ['log'] });
        cy.mount(WithAllConsoleTypes, 'with-all-console-types');
    });

    it('should throw AssertionError on a failed console.assert', () => {
        cy.setConfig({ consoleTypes: ['assert'] });
        cy.mount(WithAllConsoleTypes, 'with-all-console-types');
    });
});
