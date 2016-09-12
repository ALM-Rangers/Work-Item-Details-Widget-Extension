//---------------------------------------------------------------------
// <copyright file="menu.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>TypeScript file for work item details widget extension</summary>
//---------------------------------------------------------------------
define(["require", "exports", "VSS/Authentication/Services"], function (require, exports, Services) {
    /// <reference path='../typings/tsd.d.ts' />
    "use strict";
    var WiMenu = (function () {
        function WiMenu() {
        }
        WiMenu.prototype.getDashboards = function () {
            var deferred = $.Deferred();
            var authTokenManager = Services.authTokenManager;
            VSS.getAccessToken().then(function (token) {
                var header = authTokenManager.getAuthorizationHeader(token);
                $.ajaxSetup({
                    headers: { 'Authorization': header }
                });
                var collectionUri = VSS.getWebContext().collection.uri;
                $.ajax({
                    url: collectionUri + VSS.getWebContext().project.id + "/" + VSS.getWebContext().team.id + "/_apis/dashboard/dashboards",
                    type: "GET",
                    dataType: "json",
                    data: "api-version=3.0-preview.2",
                    success: function (c) {
                        //console.log(c.dashboardEntries);
                        deferred.resolve(c.dashboardEntries);
                    },
                    error: function (e) {
                        TelemetryClient.getClient().trackException(e.response);
                    }
                });
            });
            return deferred.promise();
        };
        WiMenu.prototype.getDashboard = function (dashboardId) {
            var deferred = $.Deferred();
            var authTokenManager = Services.authTokenManager;
            VSS.getAccessToken().then(function (token) {
                var header = authTokenManager.getAuthorizationHeader(token);
                $.ajaxSetup({
                    headers: { 'Authorization': header }
                });
                var collectionUri = VSS.getWebContext().collection.uri;
                $.ajax({
                    url: collectionUri + VSS.getWebContext().project.id + "/" + VSS.getWebContext().team.id + "/_apis/dashboard/dashboards/" + dashboardId,
                    type: "GET",
                    dataType: "json",
                    data: "api-version=3.0-preview.2",
                    success: function (c) {
                        deferred.resolve(c);
                    },
                    error: function (e) {
                        TelemetryClient.getClient().trackException(e.response);
                    }
                });
            });
            return deferred.promise();
        };
        WiMenu.prototype.addWidgetToDashboard = function (dashboardid, wiid) {
            var deferred = $.Deferred();
            var authTokenManager = Services.authTokenManager;
            VSS.getAccessToken().then(function (token) {
                var header = authTokenManager.getAuthorizationHeader(token);
                $.ajaxSetup({
                    headers: { 'Authorization': header }
                });
                var w = new WiMenu();
                w.getDashboard(dashboardid).then(function (dashboard) {
                    var Widgetobj = {
                        "name": "Work Item details", "position": { "row": 0, "column": 0 }, "size": { "rowSpan": 1, "columnSpan": 2 }, "settings": "{\"wiId\":\"" + wiid + "\"}", "settingsVersion": { "major": 1, "minor": 0, "patch": 0 }, "dashboard": { "eTag": "" + dashboard.eTag + "" }, "contributionId": "" + VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".widetailswidget"
                    };
                    var toSend = JSON.stringify(Widgetobj);
                    var collectionUri = VSS.getWebContext().collection.uri;
                    $.ajax({
                        url: collectionUri + VSS.getWebContext().project.id + "/" + VSS.getWebContext().team.id + "/_apis/dashboard/dashboards/" + dashboardid + "/widgets?api-version=3.0-preview.2",
                        type: "POST",
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        data: toSend,
                        success: function (c) {
                            console.log("WorkItemDetailWidget: WI " + wiid + " is added to Dashboard " + dashboard.name);
                            deferred.resolve(c);
                        },
                        error: function (e) {
                            TelemetryClient.getClient().trackException(e.response);
                        }
                    });
                });
            });
            return deferred.promise();
        };
        return WiMenu;
    }());
    exports.WiMenu = WiMenu;
    ;
    var contributionId = VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".addToDashboard-work-item-menu";
    VSS.register(contributionId, {
        getMenuItems: function (context) {
            // Not all areas use the same format for passing work item ids. "ids" for Queries
            // "workItemIds" for backlogs
            var ids = context.ids || context.workItemIds;
            if (!ids && context.id) {
                // Boards only support a single work item
                ids = [context.id];
            }
            var calledWithActiveForm = false;
            if (!ids && context.workItemId) {
                // Work item form menu
                ids = [context.workItemId];
                calledWithActiveForm = true;
            }
            var childItems = [];
            var w = new WiMenu();
            return w.getDashboards().then(function (dashboards) {
                dashboards.forEach(function (dashboard) {
                    childItems.push({
                        text: dashboard.name,
                        title: dashboard.name,
                        action: function () {
                            TelemetryClient.getClient().trackPageView("ContextMenuAddToDashboard");
                            ids.forEach(function (value, index) {
                                w.addWidgetToDashboard(dashboard.id, value).then(function () { });
                            });
                        }
                    });
                });
                return [{
                        "text": "Add to dashboard",
                        title: "Add to dashboard",
                        icon: "img/adddashboard.png",
                        childItems: childItems
                    }];
            });
        }
    });
});
//# sourceMappingURL=menu.js.map