import { AssertionError, checkConsoleCalls, compileConsoleMessages, consoleCallsToString, createConfig, createSpies, getConsoleCalls, isSameConsoleMessage, resetSpies, updateSpies, validateConfig, } from './internal.js';
export default function failOnConsoleError(_config = {}) {
    let originConfig;
    let config;
    let compiledConsoleMessages;
    let spies;
    // the console that the spies were last created on
    let autConsole;
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
        const consoleCalls = checkConsoleCalls(getConsoleCalls(spies), compiledConsoleMessages, config.debug);
        spies = resetSpies(spies);
        if (consoleCalls.length === 0)
            return;
        throw new AssertionError(`cypress-fail-on-console-error:\n${consoleCallsToString(consoleCalls)}`);
    });
    Cypress.on('test:after:run', () => {
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
