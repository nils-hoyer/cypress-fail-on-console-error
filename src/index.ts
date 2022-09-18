import * as chai from 'chai';
import { AssertionError } from 'chai';
import { EOL } from 'os';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import typeDetect from 'type-detect';
import { Config } from './types/Config';
import { ConsoleType, someConsoleType } from './types/ConsoleType';

chai.should();
chai.use(sinonChai);

export default function failOnConsoleError(_config: Config = {}) {
    let originConfig: Required<Config> | undefined;
    let config: Required<Config> | undefined;
    let spies: Map<number, sinon.SinonSpy> | undefined;

    const getConfig = () => config;
    const setConfig = (_config: Config): void => {
        validateConfig(_config);
        config = createConfig(_config);
        originConfig = originConfig ?? { ...config };
    };

    setConfig(_config);

    Cypress.on('window:before:load', (window) => {
        spies = createSpies(config as Required<Config>, window.console);
    });

    Cypress.on('command:end', () => {
        if (!spies) return;

        const errorMessage: string | undefined = getIncludedCall(
            spies,
            config as Required<Config>
        );

        spies = resetSpies(spies);

        if (!errorMessage) return;

        throw new AssertionError(
            `cypress-fail-on-console-error: ${EOL} ${errorMessage}`
        );
    });

    Cypress.on('test:after:run', () => {
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
            chai.expect(
                someConsoleType(consoleType),
                `Unknown ConsoleType '${consoleType}'`
            ).to.be.true;
        });
    }
};

export const createConfig = (config: Config): Required<Config> => ({
    consoleMessages: config.consoleMessages ?? [],
    consoleTypes: config.consoleTypes?.length
        ? config.consoleTypes
        : [ConsoleType.ERROR],
    debug: config.debug ?? false,
});

export const createSpies = (
    config: Required<Config>,
    console: Console
): Map<ConsoleType, sinon.SinonSpy> => {
    let spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
    config.consoleTypes?.forEach((consoleType) => {
        const functionName: any = ConsoleType[consoleType].toLowerCase();
        spies.set(consoleType, sinon.spy(console, functionName));
    });
    return spies;
};

export const resetSpies = (
    spies: Map<ConsoleType, sinon.SinonSpy>
): Map<ConsoleType, sinon.SinonSpy> => {
    spies.forEach((spy) => spy.resetHistory());
    return spies;
};

export const getIncludedCall = (
    spies: Map<ConsoleType, sinon.SinonSpy>,
    config: Required<Config>
): string | undefined => {
    let includedConsoleMessage: string | undefined;
    Array.from(spies.values()).find((spy) => {
        if (!spy.called) return false;
        includedConsoleMessage = findIncludedCall(spy, config);
        return includedConsoleMessage !== undefined;
    });
    return includedConsoleMessage;
};

export const findIncludedCall = (
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

export { Config } from './types/Config';
export { ConsoleType } from './types/ConsoleType';
