import { WithInfo } from './customComponents';

describe('shouldPassOnConsoleInfo', () => {
    it('should pass on console.info', () => {
        cy.mount(WithInfo, 'with-info');
    });
});
