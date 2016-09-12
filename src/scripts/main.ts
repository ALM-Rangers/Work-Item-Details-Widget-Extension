//---------------------------------------------------------------------
// <copyright file="main.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>TypeScript file for work item details widget extension</summary>
//---------------------------------------------------------------------

/// <reference path='../typings/tsd.d.ts' />
/// <reference path='isettings.d.ts' />
"use strict";
import WiDetailsWidget = require("scripts/app");


VSS.require("TFS/Dashboards/WidgetHelpers", function (WidgetHelpers) {
    WidgetHelpers.IncludeWidgetStyles();
    VSS.register("widetailswidget", () => {
        var rollupboard = new WiDetailsWidget.WidgetWIDetails(WidgetHelpers);
        return rollupboard;
    });
    VSS.notifyLoadSucceeded();
});
