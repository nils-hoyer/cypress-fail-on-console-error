import { mount } from 'cypress/react';
import { createElement, useEffect } from 'react';

// React warns about missing keys once per parent element type, so each test uses another one
const listWithoutKeys = (type: string, items: string[]) =>
    createElement(
        type,
        null,
        items.map((item) => createElement('li', null, item))
    );
function FruitList() {
    return listWithoutKeys('ul', ['Apple', 'Pear']);
}
function VegetableList() {
    return listWithoutKeys('ol', ['Carrot', 'Leek']);
}
function NutList() {
    return listWithoutKeys('menu', ['Almond', 'Walnut']);
}

function UserCard() {
    useEffect(() => {
        console.error('Failed to load user', { id: 42, status: 500 });
    }, []);
    return createElement('p', null, 'Unknown user');
}

describe('shouldFailOnReactErrors', () => {
    it('should throw AssertionError on a missing key when the test checks the list', () => {
        mount(createElement(FruitList));
        cy.contains('Pear');
    });

    it('should throw AssertionError on console.error in useEffect when the test checks the component', () => {
        mount(createElement(UserCard));
        cy.contains('Unknown user');
    });

    it('should pass when the missing key warning is ignored', () => {
        cy.addIgnoredConsoleMessages(['unique "key" prop']);
        cy.spy(console, 'error').as('consoleError');
        mount(createElement(VegetableList));
        cy.contains('Leek');
        cy.get('@consoleError').should(
            'have.been.calledWithMatch',
            /unique "key" prop/
        );
    });

    it('should pass on a missing key when the test only mounts', () => {
        mount(createElement(NutList));
    });

    it('should get the after all hook failure for the missing key of the previous test', () => {
        cy.wrap('next test');
    });
});
