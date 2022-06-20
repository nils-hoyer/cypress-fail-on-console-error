import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {
    callToString,
    createConfig,
    createSpies,
    findIncludedCall,
    getIncludedCall,
    isErrorMessageExcluded,
    validateConfig,
} from '../dist/index';
import { Config } from '../dist/types/Config';
import { ConsoleType } from '../dist/types/ConsoleType';

chai.should();
chai.use(sinonChai);

import * as indexMock from '../dist/index';
sinon.stub(indexMock, 'cypressLogger');

describe('createConfig()', () => {
    it('WHEN includeConsoleType is not set THEN use default ConsoleType.ERROR', () => {
        const config: Partial<Config> = {};

        const given = createConfig(config);

        chai.expect(given.includeConsoleTypes.length).to.equal(1);
        chai.expect(given.includeConsoleTypes[0]).to.equal(ConsoleType.ERROR);
    });

    it('WHEN includeConsoleType is set THEN overwrite default ConsoleType.ERROR', () => {
        const config: Partial<Config> = {
            includeConsoleTypes: [ConsoleType.WARN, ConsoleType.INFO],
        };

        const given = createConfig(config);

        chai.expect(given.includeConsoleTypes.length).to.equal(2);
        chai.expect(given.includeConsoleTypes[0]).to.equal(ConsoleType.WARN);
        chai.expect(given.includeConsoleTypes[1]).to.equal(ConsoleType.INFO);
    });
});

describe('validateConfig()', () => {
    it('WHEN excludeMessages and includeConsoleTypes is valid no assertion error is throwed', () => {
        const config: Partial<Config> = {
            excludeMessages: ['foo', 'bar'],
            includeConsoleTypes: [ConsoleType.ERROR, ConsoleType.WARN],
        };

        chai.expect(() => validateConfig(config)).not.to.throw(AssertionError);
    });

    const excludeMessages = [[], [''], [3]];
    excludeMessages.forEach((_excludeMessage: any) => {
        it('WHEN excludeMessages is not valid THEN throw AssertionError', () => {
            const config: Partial<Config> = {
                excludeMessages: _excludeMessage,
            };

            chai.expect(() => validateConfig(config)).to.throw(AssertionError);
        });
    });

    const includeConsoleTypes = [[], [''], [3]];
    includeConsoleTypes.forEach((_includeConsoleType: any) => {
        it('WHEN includeConsoleTypes is not valid THEN throw AssertionError', () => {
            const config: Partial<Config> = {
                includeConsoleTypes: _includeConsoleType,
            };

            chai.expect(() => validateConfig(config)).to.throw(AssertionError);
        });
    });
});

describe('createSpies()', () => {
    it('WHEN includeConsoleTypes THEN create createSpies map', () => {
        const config: Config = createConfig({
            includeConsoleTypes: [
                ConsoleType.INFO,
                ConsoleType.WARN,
                ConsoleType.ERROR,
            ],
        });
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

describe('getIncludedCall()', () => {
    it('WHEN no spy is called THEN return undefined', () => {
        const config = createConfig({});
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, { called: false } as sinon.SinonSpy);
        spies.set(ConsoleType.WARN, { called: false } as sinon.SinonSpy);

        const includedCall = getIncludedCall(spies, config);

        chai.expect(includedCall).to.be.undefined;
    });

    it('WHEN call is excluded THEN return undefined', () => {
        const config: Config = createConfig({ excludeMessages: ['foo'] });
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, {
            called: true,
            args: [['foo']],
        } as sinon.SinonSpy);

        const includedCall = getIncludedCall(spies, config);

        chai.expect(includedCall).to.be.undefined;
    });

    it('WHEN call is included THEN return call', () => {
        const config: Config = createConfig({ excludeMessages: ['foo'] });
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, {
            called: true,
            args: [['bar']],
        } as sinon.SinonSpy);

        const includedCall = getIncludedCall(spies, config);

        chai.expect(includedCall).to.equal('bar');
    });
});

describe('findIncludedCall()', () => {
    it('WHEN config.excludeMessages is undefined THEN return first call', () => {
        const config = createConfig({});
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const includedCall = findIncludedCall(spy, config);

        chai.expect(includedCall).to.equal('foo foo1');
    });

    it('WHEN some call for errorMessage is excluded by config.excludeMessages THEN return first call some is not excluded', () => {
        const config: Config = createConfig({ excludeMessages: ['foo1'] });
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const includedCall = findIncludedCall(spy, config);

        chai.expect(includedCall).to.equal('foo3 foo4');
    });

    it('WHEN some call for all errorMessages are excluded by config.excludeMessages THEN return undefined', () => {
        const config: Config = createConfig({
            excludeMessages: ['foo', 'foo3'],
        });
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const includedCall = findIncludedCall(spy, config);

        chai.expect(includedCall).to.be.undefined;
    });
});

describe('isErrorMessageExcluded()', () => {
    it('WHEN excludeMessage matching errorMessage THEN return false', () => {
        const errorMessage: string = 'foo';
        const excludeMessage: string = 'foo';

        const _isErrorMessageExcluded = isErrorMessageExcluded(
            errorMessage,
            excludeMessage,
            false
        );

        chai.expect(_isErrorMessageExcluded).to.be.true;
    });

    it('WHEN excludeMessage not matching errorMessage THEN return true', () => {
        const errorMessage: string = 'foo';
        const excludeMessage: string = 'bar';

        const _isErrorMessageExcluded = isErrorMessageExcluded(
            errorMessage,
            excludeMessage,
            false
        );

        chai.expect(_isErrorMessageExcluded).to.be.false;
    });

    it('WHEN excludeMessage not matching errorMessage THEN return true', () => {
        const errorMessage: string =
            "TypeError: Cannot read properties of undefined (reading 'map')";
        const excludeMessage: string = '.*properties.*map.*';

        const _isErrorMessageExcluded = isErrorMessageExcluded(
            errorMessage,
            excludeMessage,
            false
        );

        chai.expect(_isErrorMessageExcluded).to.be.true;
    });
});

describe('callToString()', () => {
    it('WHEN parse different args from console.log, callToString should return concated string', () => {
        const call: any[] = [
            'string',
            1,
            { foo: 'bar' },
            ['a', 1],
            undefined,
            null,
            '-[]{}()*+?.,\\^$|#s',
            new Error('new Error()'),
        ];

        const expected = callToString(call);

        chai.expect(expected).to.contains(
            'string 1 {"foo":"bar"} ["a",1] undefined null -[]{}()*+?.,\\^$|#s Error: new Error()'
        );
        chai.expect(expected).to.contains('unitTest.ts');
    });
});
