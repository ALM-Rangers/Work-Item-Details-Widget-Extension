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

/// <reference path='../typings/tsd.d.ts' />

"use strict";
import Services = require("VSS/Authentication/Services");


export class WiMenu {
    constructor() {}

    public dashboards: any;

    public getDashboards(): IPromise<any[]> {
        var deferred = $.Deferred<any>();
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
                data: `api-version=3.0-preview.2`,
                success: c => {
                    //console.log(c.dashboardEntries);
                    deferred.resolve(c.dashboardEntries);

                },
                error: e => {
                    TelemetryClient.getClient().trackException(e.response);
                }
            });

        });
        return deferred.promise();
    }

    public getDashboard(dashboardId): IPromise<any> {
        var deferred = $.Deferred<any>();
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
                data: `api-version=3.0-preview.2`,
                success: c => {
                    deferred.resolve(c);
                },
                error: e => {
                    TelemetryClient.getClient().trackException(e.response);
                }
            });

        });
        return deferred.promise();
    }

    public addWidgetToDashboard(dashboardid: string, wiid: string) {
        var deferred = $.Deferred<any>();
        var authTokenManager = Services.authTokenManager;
        VSS.getAccessToken().then(function (token) {
            var header = authTokenManager.getAuthorizationHeader(token);
            $.ajaxSetup({
                headers: { 'Authorization': header }
            });
            var w = new WiMenu();
            w.getDashboard(dashboardid).then((dashboard) => {
                
                var Widgetobj = {
                    "name": "Work Item details", "position": { "row": 0, "column": 0 }, "size": { "rowSpan": 1, "columnSpan": 2 }, "settings": "{\"wiId\":\"" + wiid + "\"}", "settingsVersion": { "major": 1, "minor": 0, "patch": 0 }, "dashboard": { "eTag": "" + dashboard.eTag + "" }, "contributionId": "" + VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".widetailswidget"
                }
                var toSend = JSON.stringify(Widgetobj);
                var collectionUri = VSS.getWebContext().collection.uri;
          
                $.ajax({
                    url: collectionUri + VSS.getWebContext().project.id + "/" + VSS.getWebContext().team.id + "/_apis/dashboard/dashboards/" + dashboardid + "/widgets?api-version=3.0-preview.2",
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    data: toSend,
                    success: c => {
                        console.log("WorkItemDetailWidget: WI " + wiid + " is added to Dashboard " + dashboard.name);
                        deferred.resolve(c);
                    },
                    error: e => {
                        TelemetryClient.getClient().trackException(e.response);
                    }
                });

            });
        });
        return deferred.promise();
    }


};


var contributionId = VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".addToDashboard-work-item-menu";
VSS.register(contributionId, {

    getMenuItems: (context) => {

        // Not all areas use the same format for passing work item ids. "ids" for Queries
        // "workItemIds" for backlogs
        var ids = context.ids || context.workItemIds;
        if (!ids && context.id) {
            // Boards only support a single work item
            ids = [context.id];
        }

        let calledWithActiveForm = false;

        if (!ids && context.workItemId) {
            // Work item form menu
            ids = [context.workItemId];
            calledWithActiveForm = true;
        }

        var childItems: IContributedMenuItem[] = [];

        var w = new WiMenu();
        return w.getDashboards().then((dashboards) => {
            dashboards.forEach((dashboard) => {
                childItems.push(<IContributedMenuItem>{
                    text: dashboard.name,
                    title: dashboard.name,
                    action: () => {
                        TelemetryClient.getClient().trackPageView("ContextMenuAddToDashboard");
                        ids.forEach((value, index) => {
                            w.addWidgetToDashboard(dashboard.id, value).then(() => { });
                        });
                    }
                });

            });

            return [<IContributedMenuItem>{
                "text": "Add to dashboard",
                title: "Add to dashboard",
                icon: "img/adddashboard.png",
                childItems: childItems
            }];

        });
    }

});


