// ---------------------------------------------------------------------
// <copyright file="app.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
// ---------------------------------------------------------------------

/// <reference path="jquery.dotdotdot.d.ts" />
"use strict";

import RestClient = require("TFS/Work/RestClient");
import CoreContracts = require("TFS/Core/Contracts");
import WorkContracts = require("TFS/Work/Contracts");
import RestClientWI = require("TFS/WorkItemTracking/RestClient");
import WorkItemsContracts = require("TFS/WorkItemTracking/Contracts");
import WorkItemServices = require("TFS/WorkItemTracking/Services");
import * as tc from "telemetryclient-team-services-extension";
import telemetryClientSettings = require("./telemetryClientSettings");

export class WidgetWIDetails {

    constructor(public WidgetHelpers) {
    }

    public client = RestClient.getClient();
    public clientwi = RestClientWI.getClient();

    public LoadWIDetails(widgetSettings) {
        tc.TelemetryClient.getClient(telemetryClientSettings.settings).trackPageView("Index");

        let customSettings = <ISettings>JSON.parse(widgetSettings.customSettings.data);

        let $title = $("h2");
        $title.text(widgetSettings.name);
        if (customSettings) {

            $("#configwidget").hide();
            $("#loadingwidget").show();
            $("#content").hide();
            $("#contentError").hide();

            // Main
            this.clientwi.getWorkItem(customSettings.wiId).then((wi) => {

                this.DisplayWIDetails(wi);
                $("#loadingwidget").hide();
                $("#content").show();

                $("#wi-title").dotdotdot();
                $("#wi-desc").dotdotdot();

                $(".widget").off(); // remove other click event load+reload where configure => prevent multiple windows
                $(".widget").on("click", function () {
                    WorkItemServices.WorkItemFormNavigationService.getService().then(service => {
                        service.openWorkItem(customSettings.wiId, false); // open the wi dialog
                    });
                });

            }, (reject) => {
                $("#loadingwidget").hide();
                $("#contentError").attr("style", "display:block;margin:10px;");
                $("#contentError").addClass("error");
                if (reject.status === "404") {
                    $("#contentError").html("TF401232: Work item Id: " + customSettings.wiId + " does not exist, or you do not have permissions to read it.");
                } else {
                    $("#contentError").html(reject.message);
                }
                tc.TelemetryClient.getClient(telemetryClientSettings.settings).trackException(reject.message);
            });

        } else {
            $title.attr("style", "color:grey");
            $("#content").hide();
            $("#loadingwidget").hide();
            $("#contentError").hide();
            $("#configwidget").show();
        }
        return this.WidgetHelpers.WidgetStatusHelper.Success();
    }

    private DisplayWIDetails(wi: WorkItemsContracts.WorkItem) {

        let witype = wi.fields["System.WorkItemType"];
        let wititle = wi.fields["System.Title"];

        let color = this.getWorkItemColor(witype);

        $("#wi-header").attr("style", "border-left-color: " + color + ";");
        $("#wi-type").html(witype + " " + wi.id);
        $("#wi-title").text(wititle);
        let desc = wi.fields["System.Description"];
        if (witype === "Bug") {
            desc = wi.fields["Microsoft.VSTS.TCM.ReproSteps"];
        }
        if (witype === "Test Case") {
            desc = wi.fields["System.Description"];
        }
        if (desc !== undefined) {
            desc = this.noHtml(desc);

            $("#wi-desc").html(desc);
        } else {
            $("#wi-desc").html("");
        }

        $("#updateby").html("Updated by ".concat(wi.fields["System.ChangedBy"]));
        $("#updatedate").html(this.DeltaDate(new Date(wi.fields["System.ChangedDate"])).text);

        let assign = wi.fields["System.AssignedTo"];

        if (assign !== undefined) {
            $("#assignuser").html(assign);
            $("#assignavatar").attr("src", this.getMemberAvatarUrl(assign));
        } else {
            $("#assignuser").html("Unassigned");
            $("#assignavatar").hide();
        }

        let state = wi.fields["System.State"];
        $("#state").html(state);

        let statecolor = this.getStateColor(state);
        let backgroundcolor = statecolor;
        if (state === "Removed") {
            backgroundcolor = "transparent";
        }
        $("#statecircle").attr("style", "border-color:" + statecolor + ";background-color:" + backgroundcolor + "");
    }

    private noHtml(txt) {
        let a = txt.indexOf("<");
        let b = txt.indexOf(">");
        let len = txt.length;
        let c = txt.substring(0, a);
        if (b === -1) {
            b = a;
        }
        let d = txt.substring((b + 1), len);
        txt = c + d;
        if (a !== b) {
            txt = this.noHtml(txt);
        }
        return (txt);
    }

    private getWorkItemColor(workItemType: string): string {
        let witColor = "";
        switch (workItemType) {
            case "Shared Steps":
            case "Shared Parameter":
            case "Test Case":
            case "Test Plan":
            case "Code Review Response":
            case "Issue":
            case "Feedback Request":
            case "Feedback Response":
            case "Code Review Request":
            case "Impediment":
            case "Test Suite":
                witColor = "#FF9D00";
                break;

            case "Product Backlog Item":
            case "User Story":
                witColor = "#009CCC";
                break;
            case "Task":
                witColor = "#F2CB1D";
                break;

            case "Bug":
                witColor = "#CC293D";
                break;

            case "Feature":
                witColor = "#773B93";
                break;

            case "Epic":
                witColor = "#FF7B00";
                break;
            default:
                witColor = "#F2CB1D";
        }
        return witColor;
    }

    private getStateColor(state: string): string {
        let statecolor = "";
        switch (state) {

            case "Approved":
            case "New":
            case "To Do":
            case "Design":
                statecolor = "#b2b2b2";
                break;
            case "In Progress":
            case "Committed":
            case "Open":
            case "Ready":
            case "Active":
            case "In Planning":
                statecolor = "#007acc";
                break;
            case "Done":
            case "Closed":
            case "Inactive":
            case "Completed":
                statecolor = "#393";
                break;
            case "Removed":
                statecolor = "#5688e0";
                break;
            default:
                statecolor = "#b2b2b2";

        }

        return statecolor;
    }

    private DeltaDate(date: Date): IDeltaDateInfo {
        let now = Date.now();
        let past = date.getTime();

        let days = Math.floor((now - past) / (1000 * 60 * 60 * 24));

        let result = {
            days: days,
            text: ""
        };

        if (days > 365) {
            let years = Math.floor(days / 365);
            if (years === 1) {
                result.text = `A year ago`;
            } else {
                result.text = `${years} year(s) ago`;
            }

        } else if (days > 30) {
            let months = Math.floor(days / 30);
            if (months === 1) {
                result.text = `A month ago`;
            } else {
                result.text = `${months} month(s) ago`;
            }

        }
        else if (days > 7) {
            result.text = "This month";
        }
        else if (days <= 7 && days > 1) {
            result.text = `${days} days ago`;
        }
        else if (days === 1) {
            result.text = "Yesterday";
        } else {
            result.text = "Today";
        }
        return result;
    }

    private getMemberAvatarUrl(memberIdentity: string): string {

        let i = memberIdentity.lastIndexOf("<");
        let j = memberIdentity.lastIndexOf(">");
        let uniqueName = $.trim(memberIdentity.substr(i + 1, j - i - 1));

        return VSS.getWebContext().host.uri + "_api/_common/IdentityImage?id=&identifier=" + uniqueName;
    }

    // Load and Reload Methods
    public load(widgetSettings) {
        return this.LoadWIDetails(widgetSettings);
    }
    public reload(widgetSettings) {
        return this.LoadWIDetails(widgetSettings);
    }
}

VSS.require("TFS/Dashboards/WidgetHelpers", function (WidgetHelpers) {
    WidgetHelpers.IncludeWidgetStyles();
    VSS.register("widetailswidget", () => {
        let widgetDetails = new WidgetWIDetails(WidgetHelpers);
        return widgetDetails;
    });
    VSS.notifyLoadSucceeded();
});

interface IDeltaDateInfo {
    text: string;
    days: number;

}