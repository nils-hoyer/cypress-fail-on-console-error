import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import typeDetect from 'type-detect';

type ConsoleType = 'error' | 'warn' | 'info';
interface Config {
    consoleMessages?: (string | RegExp)[];
    consoleTypes?: ConsoleType[];
    debug?: boolean;
}

export { Config };
export { ConsoleType };

chai.should();
chai.use(sinonChai);

export default function failOnConsoleError(_config: Config = {}) {
    let originConfig: Required<Config> | undefined;
    let config: Required<Config> | undefined;
    let spies: Map<ConsoleType, sinon.SinonSpy> | undefined;

    const getConfig = () => config;
    const setConfig = (_config: Config): void => {
        validateConfig(_config);
        config = createConfig(_config);
        originConfig = originConfig ?? { ...config };
    };

    setConfig(_config);

    const setSpies = (window: Cypress.AUTWindow) =>
        (spies = createSpies(config as Required<Config>, window.console));

    if (Cypress.testingType === 'component') {
        before(() => cy.window().then(setSpies));
    } else {
        Cypress.on('window:before:load', setSpies);
    }

    Cypress.on('command:end', () => {
        if (!spies) return;

        const consoleMessage: string | undefined = getConsoleMessageIncluded(
            spies,
            config as Required<Config>
        );

        spies = resetSpies(spies);

        if (!consoleMessage) return;

        throw new AssertionError(
            `cypress-fail-on-console-error:\n${consoleMessage}`
        );
    });

    Cypress.on('test:after:run', () => {
        if (spies) {
            spies = resetSpies(spies);
        }

        setConfig(originConfig as Config);
    });

    return {
        getConfig,
        setConfig,
    };
}

export const validateConfig = (config: Config): void => {
    if (config.consoleMessages) {
        config.consoleMessages.forEach((consoleMessage) => {
            chai.expect(typeDetect(consoleMessage)).to.be.oneOf([
                'string',
                'RegExp',
            ]);
            chai.expect(consoleMessage.toString()).to.have.length.above(0);
        });
    }

    if (config.consoleTypes) {
        chai.expect(config.consoleTypes).not.to.be.empty;
        config.consoleTypes.forEach((consoleType) => {
            chai.expect(['error', 'warn', 'info'] as ConsoleType[]).contains(
                consoleType
            );
        });
    }
};

export const createConfig = (config: Config): Required<Config> => ({
    consoleMessages: config.consoleMessages ?? [],
    consoleTypes: config.consoleTypes?.length ? config.consoleTypes : ['error'],
    debug: config.debug ?? false,
});

export const createSpies = (
    config: Required<Config>,
    console: Console
): Map<ConsoleType, sinon.SinonSpy> => {
    let spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
    config.consoleTypes?.forEach((consoleType) => {
        spies.set(consoleType, sinon.spy(console, consoleType));
    });
    return spies;
};

export const resetSpies = (
    spies: Map<ConsoleType, sinon.SinonSpy>
): Map<ConsoleType, sinon.SinonSpy> => {
    spies.forEach((spy) => spy.resetHistory());
    return spies;
};

export const getConsoleMessageIncluded = (
    spies: Map<ConsoleType, sinon.SinonSpy>,
    config: Required<Config>
): string | undefined => {
    let includedConsoleMessage: string | undefined;
    Array.from(spies.values()).find((spy) => {
        if (!spy.called) return false;
        includedConsoleMessage = findConsoleMessageIncluded(spy, config);
        return includedConsoleMessage !== undefined;
    });
    return includedConsoleMessage;
};

export const findConsoleMessageIncluded = (
    spy: sinon.SinonSpy,
    config: Required<Config>
): string | undefined => {
    const consoleMessages = spy.args.map((call: any[]) => callToString(call));

    if (config.consoleMessages.length === 0) {
        return consoleMessages[0];
    }

    return consoleMessages.find((consoleMessage: string) => {
        const someConsoleMessagesExcluded = config.consoleMessages.some(
            (configConsoleMessage: string | RegExp) =>
                isConsoleMessageExcluded(
                    consoleMessage,
                    configConsoleMessage,
                    config.debug
                )
        );
        if (config.debug) {
            cypressLogger('consoleMessage_excluded', {
                consoleMessage,
                someConsoleMessagesExcluded,
            });
        }
        return !someConsoleMessagesExcluded;
    });
};

export const isConsoleMessageExcluded = (
    consoleMessage: string,
    configConsoleMessage: string | RegExp,
    debug: boolean
) => {
    const configConsoleMessageRegExp =
        configConsoleMessage instanceof RegExp
            ? configConsoleMessage
            : new RegExp(configConsoleMessage);
    const consoleMessageExcluded =
        configConsoleMessageRegExp.test(consoleMessage);
    if (debug) {
        cypressLogger('consoleMessage_configConsoleMessage_match', {
            consoleMessage,
            configConsoleMessage,
            consoleMessageExcluded,
        });
    }
    return consoleMessageExcluded;
};

export const callToString = (calls: any[]): string =>
    calls
        .reduce((previousValue, currentValue) => {
            const _value = currentValue?.stack ?? currentValue;
            const _currentValue =
                typeof _value !== 'string' ? JSON.stringify(_value) : _value;
            return `${previousValue} ${_currentValue}`;
        }, '')
        .trim();

export const cypressLogger = (name: string, message: any) => {
    Cypress.log({
        name: name,
        displayName: name,
        message: JSON.stringify(message),
        consoleProps: () => message,
    });
};
