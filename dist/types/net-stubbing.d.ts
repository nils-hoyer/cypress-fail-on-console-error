/**
 * HTTP request/response types.
 */
export declare namespace CyHttpMessages {
    interface BaseMessage {
        body?: any;
        headers: {
            [key: string]: string;
        };
        url: string;
        method?: string;
        httpVersion?: string;
    }
    export type IncomingResponse = BaseMessage & {
        statusCode: number;
        statusMessage: string;
    };
    export type IncomingHttpResponse = IncomingResponse & {
        /**
         * Continue the HTTP response, merging the supplied values with the real response.
         */
        send(status: number, body?: string | number | object, headers?: {
            [key: string]: string;
        }): void;
        send(body: string | object, headers?: {
            [key: string]: string;
        }): void;
        send(staticResponse: StaticResponse): void;
        /**
         * Continue the HTTP response to the browser, including any modifications made to `res`.
         */
        send(): void;
        /**
         * Wait for `delayMs` milliseconds before sending the response to the client.
         */
        delay: (delayMs: number) => IncomingHttpResponse;
        /**
         * Serve the response at `throttleKbps` kilobytes per second.
         */
        throttle: (throttleKbps: number) => IncomingHttpResponse;
    };
    export type IncomingRequest = BaseMessage & {
        responseTimeout?: number;
    };
    export interface IncomingHttpRequest extends IncomingRequest {
        destroy(): void;
        reply(interceptor?: StaticResponse | HttpResponseInterceptor): void;
        reply(body: string | object, headers?: {
            [key: string]: string;
        }): void;
        reply(status: number, body?: string | object, headers?: {
            [key: string]: string;
        }): void;
        redirect(location: string, statusCode: number): void;
    }
    export {};
}
export interface DictMatcher<T> {
    [key: string]: T;
}
/**
 * Matches a string using glob (`*`) matching.
 */
export declare type GlobPattern = string;
export declare type HttpRequestInterceptor = (req: CyHttpMessages.IncomingHttpRequest) => void | Promise<void>;
export declare type HttpResponseInterceptor = (res: CyHttpMessages.IncomingHttpResponse, send?: () => void) => void | Promise<void>;
/**
 * Matches a single number or any of an array of acceptable numbers.
 */
export declare type NumberMatcher = number | number[];
/**
 * Request/response cycle.
 */
export interface Request {
    id: string;
    log: any;
    request: CyHttpMessages.IncomingRequest;
    /**
     * Was `cy.wait()` used to wait on this request?
     * @internal
     */
    requestWaited: boolean;
    response?: CyHttpMessages.IncomingResponse;
    responseHandler?: HttpResponseInterceptor;
    /**
     * Was `cy.wait()` used to wait on the response to this request?
     * @internal
     */
    responseWaited: boolean;
    state: RequestState;
}
export declare type RequestState = 'Received' | 'Intercepted' | 'ResponseReceived' | 'ResponseIntercepted' | 'Complete' | 'Errored';
export interface Route {
    alias?: string;
    log: any;
    options: RouteMatcherOptions;
    handler: RouteHandler;
    hitCount: number;
    requests: {
        [key: string]: Request;
    };
}
export interface RouteMap {
    [key: string]: Route;
}
/**
 * A `RouteMatcher` describes a filter for HTTP requests.
 */
export declare type RouteMatcher = StringMatcher | RouteMatcherOptions;
export interface RouteMatcherCompatOptions {
    response?: string | object;
}
export declare type RouteMatcherOptions = RouteMatcherOptionsGeneric<StringMatcher>;
export interface RouteMatcherOptionsGeneric<S> extends RouteMatcherCompatOptions {
    /**
     * Match HTTP basic authentication.
     */
    auth?: {
        username: S;
        password: S;
    };
    /**
     * Match client request headers.
     */
    headers?: DictMatcher<S>;
    /**
     * Match based on requested hostname.
     */
    hostname?: S;
    /**
     * Match requests served via HTTPS only.
     */
    https?: boolean;
    /**
     * @default 'GET'
     */
    method?: S;
    /**
     * Match on request path after the hostname, including query params.
     */
    path?: S;
    /**
     * Matches like `path`, but without query params.
     */
    pathname?: S;
    /**
     * Match based on requested port.
     */
    port?: NumberMatcher;
    /**
     * Match on parsed querystring parameters.
     */
    query?: DictMatcher<S>;
    /**
     * Match based on full request URL.
     */
    url?: S;
}
export declare type RouteHandlerController = HttpRequestInterceptor;
export declare type RouteHandler = string | StaticResponse | RouteHandlerController | object;
/**
 * Describes a response that will be sent back to the browser to fulfill the request.
 */
export declare type StaticResponse = GenericStaticResponse<string, string | object>;
export interface GenericStaticResponse<Fixture, Body> {
    /**
     * If set, serve a fixture as the response body.
     */
    fixture?: Fixture;
    /**
     * If set, serve a static string/JSON object as the response body.
     */
    body?: Body;
    /**
     * @default {}
     */
    headers?: {
        [key: string]: string;
    };
    /**
     * @default 200
     */
    statusCode?: number;
    /**
     * If `forceNetworkError` is truthy, Cypress will destroy the connection to the browser and send no response. Useful for simulating a server that is not reachable. Must not be set in combination with other options.
     */
    forceNetworkError?: boolean;
}
/**
 * Either a `GlobPattern` string or a `RegExp`.
 */
export declare type StringMatcher = GlobPattern | RegExp;
declare global {
    namespace Cypress {
        interface Chainable<Subject = any> {
            route2(url: RouteMatcher, response?: RouteHandler): Chainable<null>;
            route2(method: string, url: RouteMatcher, response?: RouteHandler): Chainable<null>;
        }
    }
}
