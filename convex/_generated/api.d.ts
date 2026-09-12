/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as festivalConfig from "../festivalConfig.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_reportError from "../lib/reportError.js";
import type * as lib_sanitize from "../lib/sanitize.js";
import type * as profiles from "../profiles.js";
import type * as telemetry from "../telemetry.js";
import type * as telemetryActions from "../telemetryActions.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  festivalConfig: typeof festivalConfig;
  "lib/auth": typeof lib_auth;
  "lib/events": typeof lib_events;
  "lib/reportError": typeof lib_reportError;
  "lib/sanitize": typeof lib_sanitize;
  profiles: typeof profiles;
  telemetry: typeof telemetry;
  telemetryActions: typeof telemetryActions;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
