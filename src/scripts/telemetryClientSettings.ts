// ---------------------------------------------------------------------
// <copyright file="TelemetryClientSettings.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
// ---------------------------------------------------------------------

import * as tc from "telemetryclient-team-services-extension";
let config = require("./appConfig.json");

export const settings: tc.TelemetryClientSettings = {
    key: config.ApplicationInsights.InstrumentationKey,
    extensioncontext: config.ApplicationInsights.ExtensionContext,
    disableTelemetry: config.ApplicationInsights.DisableTelemetry,
    disableAjaxTracking: config.ApplicationInsights.DisableAjaxTracking,
    enableDebug: config.ApplicationInsights.EnableDebug
};