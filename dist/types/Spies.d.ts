/// <reference types="sinon" />
export interface Spies extends Map<number, sinon.SinonSpy> {
    [key: number]: sinon.SinonSpy;
}
