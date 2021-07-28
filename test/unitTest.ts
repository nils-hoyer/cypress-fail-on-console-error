import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {
    callToString,
    createConfig,
    createSpies,
    getIncludedSpy,
    isExcludedMessage,
    resetSpies,
    someIncludedCall,
    someSpyCalled,
    validateConfig,
} from '../dist/index';
import { Config } from '../dist/types/Config';
import { ConsoleType } from '../dist/types/ConsoleType';

chai.should();
chai.use(sinonChai);

describe('createConfig()', () => {
    it('when includeConsoleType is not set then use default ConsoleType.ERROR', () => {
        const config: Config = {};

        const given = createConfig(config);

        chai.expect(given.includeConsoleTypes.length).to.equal(1);
        chai.expect(given.includeConsoleTypes[0]).to.equal(ConsoleType.ERROR);
    });

    it('when includeConsoleType is set then overwrite default ConsoleType.ERROR', () => {
        const config: Config = {
            includeConsoleTypes: [ConsoleType.WARN, ConsoleType.INFO],
        };

        const given = createConfig(config);

        chai.expect(given.includeConsoleTypes.length).to.equal(2);
        chai.expect(given.includeConsoleTypes[0]).to.equal(ConsoleType.WARN);
        chai.expect(given.includeConsoleTypes[1]).to.equal(ConsoleType.INFO);
    });
});

describe('validateConfig()', () => {
    it('when excludeMessages and includeConsoleTypes is valid no assertion error is throwed', () => {
        const config: Config = {
            excludeMessages: ['foo', 'bar'],
            includeConsoleTypes: [ConsoleType.ERROR, ConsoleType.WARN],
        };

        chai.expect(() => validateConfig(config)).not.to.throw(AssertionError);
    });

    const excludeMessages = [[], [''], [3]];
    excludeMessages.forEach((_excludeMessage: any) => {
        it('when excludeMessages is not valid then throw AssertionError', () => {
            const config: Config = { excludeMessages: _excludeMessage };

            chai.expect(() => validateConfig(config)).to.throw(AssertionError);
        });
    });

    const includeConsoleTypes = [[], [''], [3]];
    includeConsoleTypes.forEach((_includeConsoleType: any) => {
        it('when includeConsoleTypes is not valid then throw AssertionError', () => {
            const config: Config = { includeConsoleTypes: _includeConsoleType };

            chai.expect(() => validateConfig(config)).to.throw(AssertionError);
        });
    });
});

describe('createSpies()', () => {
    it('when includeConsoleTypes then create createSpies map', () => {
        const config: Config = {
            includeConsoleTypes: [
                ConsoleType.INFO,
                ConsoleType.WARN,
                ConsoleType.ERROR,
            ],
        };
        const console: any = {
            info: () => true,
            warn: () => true,
            error: () => true,
        };

        const spies: Map<ConsoleType, sinon.SinonSpy> = createSpies(
            config,
            console
        );

        const spiesIterator = spies.keys();
        chai.expect(spies.size).to.equals(3);
        chai.expect(spiesIterator.next().value).to.equals(
            config.includeConsoleTypes[0]
        );
        chai.expect(spiesIterator.next().value).to.equals(
            config.includeConsoleTypes[1]
        );
        chai.expect(spiesIterator.next().value).to.equals(
            config.includeConsoleTypes[2]
        );
    });
});

describe('resetSpies()', () => {
    it('when resetHistory is called then spies should be resetted', () => {
        const objectToSpy: any = { error: () => true, warn: () => true };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, sinon.spy(objectToSpy, 'error'));
        spies.set(ConsoleType.WARN, sinon.spy(objectToSpy, 'warn'));
        objectToSpy.error();
        chai.expect(spies.get(ConsoleType.ERROR)).be.called;
        chai.expect(spies.get(ConsoleType.WARN)).not.be.called;

        const expectedSpies: Map<ConsoleType, sinon.SinonSpy> = resetSpies(
            spies
        );

        chai.expect(expectedSpies.get(ConsoleType.ERROR)).not.be.called;
        chai.expect(expectedSpies.get(ConsoleType.WARN)).not.be.called;
    });
});

describe('someSpyCalled()', () => {
    it('when spy was called then return true', () => {
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, { called: true } as sinon.SinonSpy);
        spies.set(ConsoleType.WARN, { called: false } as sinon.SinonSpy);

        const called: any = someSpyCalled(spies);

        chai.expect(called).to.be.true;
    });

    it('when spy was not called then return false', () => {
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, { called: false } as sinon.SinonSpy);
        spies.set(ConsoleType.WARN, { called: false } as sinon.SinonSpy);

        const exptecedSpyCalled: boolean = someSpyCalled(spies);

        chai.expect(exptecedSpyCalled).to.be.false;
    });
});

//TODO stub inner function
describe('getIncludedSpy()', () => {
    it('when spies contains some spy called but not included call', () => {
        const config: Config = { excludeMessages: ['foo'] };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, {
            called: true,
            args: [['foo']],
        } as sinon.SinonSpy);

        const expectedSpy: sinon.SinonSpy = getIncludedSpy(spies, config);

        chai.expect(expectedSpy).to.be.undefined;
    });

    it('when spies contains some spy called and included call', () => {
        const config: Config = { excludeMessages: ['foo'] };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, {
            called: true,
            args: [['bar']],
        } as sinon.SinonSpy);

        const expectedSpy: sinon.SinonSpy = getIncludedSpy(spies, config);

        chai.expect(expectedSpy).not.to.be.undefined;
    });

    it('when spies contains all spy not called', () => {
        const config: Config = { excludeMessages: ['foo'] };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, {
            called: false,
        } as sinon.SinonSpy);

        const expectedSpy: sinon.SinonSpy = getIncludedSpy(spies, config);

        chai.expect(expectedSpy).to.be.undefined;
    });
});

//TODO stub inner function
describe('someIncludedCall()', () => {
    it('when isExcludedMessage always is true then someIncludedCall return false', () => {
        const spy: sinon.SinonSpy = { args: [['foo']] } as sinon.SinonSpy;
        const config: Config = { excludeMessages: ['foo'] };

        const expected = someIncludedCall(spy, config);

        chai.expect(expected).to.be.false;
    });

    it('when isExcludedMessage once is false then someIncludedCall return true', () => {
        const spy: sinon.SinonSpy = {
            args: [['foo']],
        } as sinon.SinonSpy;
        const config: Config = { excludeMessages: ['bar'] };

        const expected = someIncludedCall(spy, config);

        chai.expect(expected).to.be.true;
    });

    it('when not config.excludeMessages then return true', () => {
        const spy: sinon.SinonSpy = { args: [['foo']] } as sinon.SinonSpy;
        const config: Config = {};

        const expected = someIncludedCall(spy, config);

        chai.expect(expected).to.be.true;
    });
});

describe('isExcludeMessage()', () => {
    it('when config.excludeMessages matching spy call message then return true', () => {
        const callMessage: string = 'foo';
        const excludeMessages: string[] = ['some', 'foo'];

        const expected = isExcludedMessage(excludeMessages, callMessage);

        chai.expect(expected).to.be.true;
    });

    it('when config.excludeMessages not matching spy call message then return false', () => {
        const callMessage: string = 'foo';
        const excludeMessages: string[] = ['some', 'bar'];

        const expected = isExcludedMessage(excludeMessages, callMessage);

        chai.expect(expected).to.be.false;
    });
});

describe('callToString()', () => {
    it('when parse different types, callToString should return string', () => {
        try {
            throw new Error('Test error');
        } catch (error) {
            const call: any[] = [
                'stringValue',
                1,
                { foo: 'bar' },
                error,
                ['a', 1],
                undefined,
                null,
            ];

            const expected = callToString(call);

            chai.expect(expected).to.equals(
                'stringValue 1 {"foo":"bar"} Test error ["a",1] undefined null'
            );
        }
    });
});
