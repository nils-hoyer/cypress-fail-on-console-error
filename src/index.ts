import * as chai from 'chai';
import * as sinon from 'sinon';
import { Config } from './types/Config';
import { ConsoleType, containsConsoleType } from './types/ConsoleType';

//TODO: how to use es6 import in sinon-chai
// import * as sinonChai from 'sinon-chai';
var sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

//TODO
//1. extend isExlcudeMessage for spiesMap
//2. delete spies and set undefined? add tests for deleteSpies

export default function failOnConsoleError(config: Config = {}): void {
    //TODO: should be type Spies - get() set() not available
    let spies: any | undefined; // Map<number, sinon.SinonSpy>

    validateConfig(config);
    config = createConfig(config);

    Cypress.on('window:before:load', (win) => {
        spies = createSpies(config, win.console);
    });

    // needs to be cleaned to ensure multiple tests are failing
    // create 1 cypress integration test to run with multiple tests, ensuring its contine executing tests
    Cypress.on('command:enqueued', () => {
        spies = undefined;
    });

    Cypress.on('command:end', () => {
        if (!spies.get(ConsoleType.ERROR) || !someSpyCalled(spies)) {
            return;
        }

        if (!isExludeMessage(spies.get(ConsoleType.ERROR), config)) {
            chai.expect(spies.get(ConsoleType.ERROR)).to.have.callCount(0);
        }
    });
}

export const validateConfig = (config: Config): void => {
    config.excludeMessages?.forEach((_excludeMessage) => {
        chai.expect(
            _excludeMessage.trim().length === 0,
            'excludeMessages contains empty string'
        ).not.to.be.true;
    });

    config.includeConsoleTypes?.forEach((_includeConsoleType) => {
        chai.expect(
            !containsConsoleType(_includeConsoleType),
            'includeConsoleTypes contains unknown ConsoleType'
        ).not.to.be.true;
    });
};

export const createConfig = (config: Config): Config => {
    const includeConsoleTypes: ConsoleType[] = config.includeConsoleTypes
        ?.length
        ? config.includeConsoleTypes
        : [ConsoleType.ERROR];
    return {
        ...config,
        includeConsoleTypes,
    };
};

export const createSpies = (config: Config, console: Console): any => {
    let spies: any = new Map();
    config.includeConsoleTypes?.forEach((_consoleType) => {
        const functionName: any = ConsoleType[_consoleType].toLowerCase();
        spies.set(_consoleType, sinon.spy(console, functionName));
    });
    return spies;
};

export const someSpyCalled = (
    spies: Map<ConsoleType, sinon.SinonSpy>
): boolean => {
    return Array.from(spies).some(([key, value]) => value.called);
};

export const isExludeMessage = (
    spy: sinon.SinonSpy,
    config: Config
): boolean => {
    if (!config.excludeMessages) {
        return false;
    }

    const errorMessage: string = spy.args[0][0];
    chai.expect(errorMessage).not.to.be.undefined;

    return config.excludeMessages.some((_excludeMessage) => {
        const hasMatch: number =
            errorMessage.match(_excludeMessage)?.length || 0;
        return hasMatch > 0;
    });
};
