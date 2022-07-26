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

export default function failOnConsoleError(config: Config = {}): void {
    let spies: Map<number, sinon.SinonSpy> | undefined;

    validateConfig(config);
    config = createConfig(config);

    Cypress.on('window:before:load', (window) => {
        spies = createSpies(config, window.console);
    });

    Cypress.on('command:end', () => {
        if (!spies) return;

        const errorMessage: string | undefined = getIncludedCall(spies, config);

        spies = resetSpies(spies);

        if (errorMessage) {
            throw new AssertionError(
                `cypress-fail-on-console-error: ${EOL} ${errorMessage}`
            );
        }
    });
}

export const validateConfig = (config: Config): void => {
    if (config.excludeMessages) {
        chai.expect(config.excludeMessages).not.to.be.empty;
        config.excludeMessages.forEach((_excludeMessage) => {
            chai.expect(typeDetect(_excludeMessage)).to.be.oneOf([
                'string',
                'RegExp',
            ]);
            chai.expect(_excludeMessage.toString()).to.have.length.above(0);
        });
    }

    if (config.includeConsoleTypes) {
        chai.expect(config.includeConsoleTypes).not.to.be.empty;
        config.includeConsoleTypes.forEach((_includeConsoleType) => {
            chai.expect(
                someConsoleType(_includeConsoleType),
                `includeConsoleTypes '${_includeConsoleType}' is an unknown ConsoleType`
            ).to.be.true;
        });
    }
};

export const createConfig = (config: Config): Config => ({
    excludeMessages: config.excludeMessages,
    includeConsoleTypes: config.includeConsoleTypes?.length
        ? config.includeConsoleTypes
        : [ConsoleType.ERROR],
    cypressLog: config.cypressLog ?? false,
});

export const createSpies = (
    config: Config,
    console: Console
): Map<ConsoleType, sinon.SinonSpy> => {
    let spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
    config.includeConsoleTypes?.forEach((_consoleType) => {
        const functionName: any = ConsoleType[_consoleType].toLowerCase();
        spies.set(_consoleType, sinon.spy(console, functionName));
    });
    return spies;
};

export const resetSpies = (
    spies: Map<ConsoleType, sinon.SinonSpy>
): Map<ConsoleType, sinon.SinonSpy> => {
    spies.forEach((_spy) => _spy.resetHistory());
    return spies;
};

export const getIncludedCall = (
    spies: Map<ConsoleType, sinon.SinonSpy>,
    config: Config
): string | undefined => {
    let errorMessage: string | undefined;
    Array.from(spies.values()).forEach((spy) => {
        if (!spy.called) return;

        const includedCall = findIncludedCall(spy, config);

        if (includedCall !== undefined) {
            errorMessage = includedCall;
        }
    });
    return errorMessage;
};

export const findIncludedCall = (
    spy: sinon.SinonSpy,
    config: Config
): string | undefined => {
    const errorMessages = spy.args.map((call: any[]) => callToString(call));

    if (config.excludeMessages === undefined) {
        return errorMessages[0];
    }

    return errorMessages.find((_errorMessage: string) => {
        const _isErrorMessageExcluded: boolean = (
            config.excludeMessages as any
        ).some((_excludeMessage: string) =>
            isErrorMessageExcluded(
                _errorMessage,
                _excludeMessage,
                config.cypressLog as any
            )
        );
        if (config.cypressLog === true) {
            cypressLogger('errorMessage_excluded', {
                _errorMessage,
                _isErrorMessageExcluded,
            });
        }
        return !_isErrorMessageExcluded;
    });
};

export const isErrorMessageExcluded = (
    errorMessage: string,
    excludeMessage: string,
    cypressLog: boolean
) => {
    const match = (errorMessage.match(excludeMessage)?.length || 0) > 0;
    if (cypressLog) {
        cypressLogger('errorMessage_excludeMessage_match', {
            errorMessage,
            excludeMessage,
            match,
        });
    }
    return match;
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

export const consoleType = ConsoleType;
