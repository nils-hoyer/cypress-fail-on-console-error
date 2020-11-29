import Agent = Cypress.Agent;

export default function failOnConsoleError() {
  if (!Cypress.env('failOnConsoleError')) {
    return;
  }

  let spy: Agent<sinon.SinonSpy> | undefined;

  Cypress.on('window:before:load', (win) => {
    spy = cy.spy(win.console, 'error');
  });

  beforeEach(() => {
    spy = undefined;
  });

  afterEach(() => {
    if (spy) {
      cy.window().then((win) => {
        expect(win.console.error).to.have.callCount(0);
      });
    }
  });
}
