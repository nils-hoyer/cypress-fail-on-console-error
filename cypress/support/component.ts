import './commands';

import {
    ROOT_SELECTOR,
    setupHooks,
    getContainerEl,
} from '@cypress/mount-utils';

declare global {
    namespace Cypress {
        interface Chainable {
            mount(
                webComponent: CustomElementConstructor,
                kebabCaseName: Lowercase<string>
            ): Chainable<Element | null>;
        }
    }
}

// Adapted from web components example at
//   https://github.com/cypress-io/cypress/tree/develop/npm/mount-utils#readme
Cypress.on('run:start', () => {
    Cypress.on('test:before:run', () => {
        getContainerEl().innerHTML = '';
    });
});

function maybeRegisterComponent<T extends CustomElementConstructor>(
    name: string,
    webComponent: T
) {
    if (window.customElements.get(name)) {
        return;
    }

    window.customElements.define(name, webComponent);
}

export function mount(
    webComponent: CustomElementConstructor,
    kebabCaseName: Lowercase<string>
): Cypress.Chainable<Element | null> {
    maybeRegisterComponent(kebabCaseName, webComponent);
    document.querySelector(ROOT_SELECTOR)!.innerHTML =
        `<${kebabCaseName} id="root"></${kebabCaseName}>`;

    return cy.wrap(document.querySelector('#root'), { log: false });
}

setupHooks();

Cypress.Commands.add('mount', mount);
