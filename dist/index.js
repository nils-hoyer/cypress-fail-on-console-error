import { checkConsoleCalls, compileConsoleMessages, consoleCallsToString, createConfig, createSpies, findIgnoringConsoleMessage, getConsoleCalls, isSameConsoleMessage, logConsoleCall, resetSpies, updateSpies, validateCommandArgument, validateConfig, } from './internal.js';
// a console message failed the test, like a failed assertion. Named like chai's
// AssertionError, so Cypress shows failures as before 6.0.
class AssertionError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'AssertionError';
    }
}
// set on Cypress, which is created anew for every spec, so it also catches two copies of the package
const registered = Symbol.for('cypress-fail-on-console-error');
export default function failOnConsoleError(_config = {}) {
    // a second call would watch the console again and report every message twice
    if (Cypress[registered]) {
        throw new Error('cypress-fail-on-console-error: failOnConsoleError() was called more than once. Call it once, in your support file.');
    }
    Cypress[registered] = true;
    let originConfig;
    let config;
    let compiledConsoleMessages;
    let spies;
    // the console that the spies were last created on
    let autConsole;
    // calls from pages that unloaded before the check after the command
    let unloadedConsoleCalls = [];
    // reported together at the end of the spec, see the after hook below
    let lateConsoleCalls = [];
    // the test that ended last, until the next test starts, with the patterns it ignored
    let endedTest;
    // a copy, so changes to it don't look like they were applied
    const getConfig = () => createConfig(config);
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
    // the calls since the last check
    const takeConsoleCalls = () => {
        const consoleCalls = [
            ...unloadedConsoleCalls,
            ...(spies ? getConsoleCalls(spies) : []),
        ];
        unloadedConsoleCalls = [];
        if (spies)
            spies = resetSpies(spies);
        return consoleCalls;
    };
    // calls after a test's last command belong to that test, and are filtered with its
    // patterns. A failed test already shows its own error, so its calls are dropped.
    const takeConsoleCallsOfEndedTest = () => {
        if (!endedTest)
            return;
        const { title, passed, compiledConsoleMessages } = endedTest;
        const consoleCalls = takeConsoleCalls().filter((consoleCall) => !findIgnoringConsoleMessage(consoleCall, compiledConsoleMessages));
        if (passed && consoleCalls.length > 0) {
            lateConsoleCalls.push({
                title,
                consoleCalls,
                compiledConsoleMessages,
            });
        }
    };
    const checkConsole = () => {
        if (!spies)
            return;
        // in a hook after the test: failing it would skip the rest of the suite
        if (endedTest) {
            takeConsoleCallsOfEndedTest();
            return;
        }
        const consoleCalls = checkConsoleCalls(takeConsoleCalls(), compiledConsoleMessages, config.debug);
        if (consoleCalls.length === 0)
            return;
        throw new AssertionError(`cypress-fail-on-console-error:\n${consoleCallsToString(consoleCalls)}`);
    };
    const reportLateConsoleCalls = () => {
        takeConsoleCallsOfEndedTest();
        const reported = lateConsoleCalls;
        lateConsoleCalls = [];
        if (reported.length === 0)
            return;
        reported.forEach(({ consoleCalls, compiledConsoleMessages }) => consoleCalls.forEach((consoleCall) => logConsoleCall(consoleCall, compiledConsoleMessages)));
        throw new AssertionError([
            'cypress-fail-on-console-error:',
            ...reported.map(({ title, consoleCalls }) => `logged after the test "${title}" ended:\n${consoleCallsToString(consoleCalls)}`),
            'End these tests with an assertion that waits for the page, so that a message fails the test that logged it.',
        ].join('\n'));
    };
    if (Cypress.testingType === 'component') {
        before(() => cy.window().then(setSpies));
    }
    else {
        Cypress.on('window:before:load', setSpies);
    }
    Cypress.on('command:end', checkConsole);
    // a root hook, so it runs after the afterEach hooks of the spec's suites. Root
    // afterEach hooks registered later run after it, and only collect calls.
    afterEach(function () {
        var _a, _b;
        var _c;
        endedTest = {
            title: (_c = (_a = this.currentTest) === null || _a === void 0 ? void 0 : _a.fullTitle()) !== null && _c !== void 0 ? _c : '',
            passed: ((_b = this.currentTest) === null || _b === void 0 ? void 0 : _b.state) === 'passed',
            compiledConsoleMessages,
        };
    });
    Cypress.on('test:before:run', () => {
        takeConsoleCallsOfEndedTest();
        endedTest = undefined;
    });
    // the calls of all tests after their last command, reported once at the end of the
    // spec: Cypress doesn't retry an after hook, and no tests are left to skip
    after(() => {
        cy.then(reportLateConsoleCalls);
    });
    Cypress.on('test:after:run', () => {
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
        setIgnoredConsoleMessages: (ignoreConsoleMessages) => {
            validateCommandArgument('setIgnoredConsoleMessages', ignoreConsoleMessages);
            setIgnoredConsoleMessages(ignoreConsoleMessages);
        },
        addIgnoredConsoleMessages: (ignoreConsoleMessages) => {
            validateCommandArgument('addIgnoredConsoleMessages', ignoreConsoleMessages);
            setIgnoredConsoleMessages([
                ...getConfig().ignoreConsoleMessages,
                ...ignoreConsoleMessages,
            ]);
        },
        deleteIgnoredConsoleMessages: (ignoreConsoleMessages) => {
            validateCommandArgument('deleteIgnoredConsoleMessages', ignoreConsoleMessages);
            setIgnoredConsoleMessages(getConfig().ignoreConsoleMessages.filter((consoleMessage) => !ignoreConsoleMessages.some((deleted) => isSameConsoleMessage(consoleMessage, deleted))));
        },
    });
};
