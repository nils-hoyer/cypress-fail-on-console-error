import { checkConsoleCalls, compileConsoleMessages, consoleCallsToString, createConfig, createSpies, getConsoleCalls, isSameConsoleMessage, resetSpies, updateSpies, validateConfig, } from './internal.js';
// a console message failed the test, like a failed assertion. Named like chai's
// AssertionError, so Cypress shows failures as before 6.0.
class AssertionError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'AssertionError';
    }
}
export default function failOnConsoleError(_config = {}) {
    let originConfig;
    let config;
    let compiledConsoleMessages;
    let spies;
    // the console that the spies were last created on
    let autConsole;
    // calls from pages that unloaded before the check after the command
    let unloadedConsoleCalls = [];
    const getConfig = () => config;
    const setConfig = (_config) => {
        validateConfig(_config);
        config = createConfig(_config);
        compiledConsoleMessages = compileConsoleMessages(config.ignoreConsoleMessages);
        // a separate copy, so changes to getConfig() don't outlive the test
        originConfig = originConfig !== null && originConfig !== void 0 ? originConfig : createConfig(config);
        if (spies && autConsole) {
            spies = updateSpies(spies, config, autConsole);
        }
    };
    setConfig(_config);
    const setSpies = (window) => {
        // a page that navigates during a command, for example after a click, logs before the next page loads
        if (spies)
            unloadedConsoleCalls.push(...getConsoleCalls(spies));
        autConsole = window.console;
        spies = createSpies(config, window.console);
    };
    if (Cypress.testingType === 'component') {
        before(() => cy.window().then(setSpies));
    }
    else {
        Cypress.on('window:before:load', setSpies);
    }
    Cypress.on('command:end', () => {
        if (!spies)
            return;
        const consoleCalls = checkConsoleCalls([...unloadedConsoleCalls, ...getConsoleCalls(spies)], compiledConsoleMessages, config.debug);
        unloadedConsoleCalls = [];
        spies = resetSpies(spies);
        if (consoleCalls.length === 0)
            return;
        throw new AssertionError(`cypress-fail-on-console-error:\n${consoleCallsToString(consoleCalls)}`);
    });
    Cypress.on('test:after:run', () => {
        unloadedConsoleCalls = [];
        if (spies) {
            spies = resetSpies(spies);
        }
        setConfig(originConfig);
    });
    return {
        getConfig,
        setConfig,
    };
}
/**
 * Registers the commands getIgnoredConsoleMessages, setIgnoredConsoleMessages, addIgnoredConsoleMessages
 * and deleteIgnoredConsoleMessages, which read and change ignoreConsoleMessages for the current test.
 */
export const addIgnoredConsoleMessagesCommands = ({ getConfig, setConfig, }) => {
    const setIgnoredConsoleMessages = (ignoreConsoleMessages) => setConfig(Object.assign(Object.assign({}, getConfig()), { ignoreConsoleMessages }));
    Cypress.Commands.addAll({
        getIgnoredConsoleMessages: () => cy.wrap(getConfig().ignoreConsoleMessages, { log: false }),
        setIgnoredConsoleMessages,
        addIgnoredConsoleMessages: (ignoreConsoleMessages) => setIgnoredConsoleMessages([
            ...getConfig().ignoreConsoleMessages,
            ...ignoreConsoleMessages,
        ]),
        deleteIgnoredConsoleMessages: (ignoreConsoleMessages) => setIgnoredConsoleMessages(getConfig().ignoreConsoleMessages.filter((consoleMessage) => !ignoreConsoleMessages.some((deleted) => isSameConsoleMessage(consoleMessage, deleted)))),
    });
};
