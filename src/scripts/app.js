//---------------------------------------------------------------------
// <copyright file="app.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
//---------------------------------------------------------------------
/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="jquery.dotdotdot.d.ts" />
"use strict";
define(["require", "exports", "TFS/Work/RestClient", "TFS/WorkItemTracking/RestClient", "TFS/WorkItemTracking/Services"], function (require, exports, RestClient, RestClientWI, WorkItemServices) {
    var WidgetWIDetails = (function () {
        function WidgetWIDetails(WidgetHelpers) {
            this.WidgetHelpers = WidgetHelpers;
            this.client = RestClient.getClient();
            this.clientwi = RestClientWI.getClient();
        }
        WidgetWIDetails.prototype.LoadWIDetails = function (widgetSettings) {
            var _this = this;
            TelemetryClient.getClient().trackPageView("Index");
            var customSettings = JSON.parse(widgetSettings.customSettings.data);
            var $title = $('h2');
            $title.text(widgetSettings.name);
            if (customSettings) {
                $('#configwidget').hide();
                $('#loadingwidget').show();
                $('#content').hide();
                $('#contentError').hide();
                //Main
                this.clientwi.getWorkItem(customSettings.wiId).then(function (wi) {
                    _this.DisplayWIDetails(wi);
                    $('#loadingwidget').hide();
                    $('#content').show();
                    $("#wi-title").dotdotdot();
                    $("#wi-desc").dotdotdot();
                    var wilink = VSS.getWebContext().host.uri + VSS.getWebContext().project.name + "/_workitems?id=" + customSettings.wiId + "&fullScreen=true&_a=edit";
                    $('.widget').off(); //remove other click event load+reload where configure => prevent multiple windows
                    $('.widget').on("click", function () {
                        var workItemService = WorkItemServices.WorkItemFormNavigationService.getService().then(function (service) {
                            service.openWorkItem(customSettings.wiId, false); //open the wi dialog
                        });
                    });
                }, function (reject) {
                    $('#loadingwidget').hide();
                    $('#contentError').attr("style", "display:block;margin:10px;");
                    $('#contentError').addClass("error");
                    if (reject.status == "404") {
                        $('#contentError').html("TF401232: Work item Id: " + customSettings.wiId + " does not exist, or you do not have permissions to read it.");
                    }
                    else {
                        $('#contentError').html(reject.message);
                    }
                    TelemetryClient.getClient().trackException(reject.message);
                });
            }
            else {
                $title.attr("style", "color:grey");
                $('#content').hide();
                $('#loadingwidget').hide();
                $('#contentError').hide();
                $('#configwidget').show();
            }
            return this.WidgetHelpers.WidgetStatusHelper.Success();
        };
        WidgetWIDetails.prototype.DisplayWIDetails = function (wi) {
            var witype = wi.fields["System.WorkItemType"];
            var color = this.getWorkItemColor(witype);
            $("#wi-header").attr("style", "border-left-color: " + color + ";");
            $("#wi-type").html(witype + " " + wi.id);
            $("#wi-title").html(wi.fields["System.Title"]);
            var desc = wi.fields["System.Description"];
            if (witype == "Bug") {
                desc = wi.fields["Microsoft.VSTS.TCM.ReproSteps"];
            }
            if (witype == "Test Case") {
                desc = "";
            }
            if (desc != undefined) {
                desc = this.noHtml(desc);
                $("#wi-desc").html(desc);
            }
            else {
                $("#wi-desc").html("");
            }
            $("#updateby").html("Updated by ".concat(wi.fields["System.ChangedBy"]));
            $("#updatedate").html(this.DeltaDate(new Date(wi.fields["System.ChangedDate"])).text);
            var assign = wi.fields["System.AssignedTo"];
            if (assign != undefined) {
                $("#assignuser").html(assign);
                $("#assignavatar").attr("src", this.getMemberAvatarUrl(assign));
            }
            else {
                $("#assignuser").html("Unassigned");
                $("#assignavatar").hide();
            }
            var state = wi.fields["System.State"];
            $("#state").html(state);
            var statecolor = this.getStateColor(state);
            var backgroundcolor = statecolor;
            if (state == "Removed") {
                backgroundcolor = "transparent";
            }
            $("#statecircle").attr("style", "border-color:" + statecolor + ";background-color:" + backgroundcolor + "");
        };
        WidgetWIDetails.prototype.noHtml = function (txt) {
            var a = txt.indexOf('<');
            var b = txt.indexOf('>');
            var len = txt.length;
            var c = txt.substring(0, a);
            if (b == -1) {
                b = a;
            }
            var d = txt.substring((b + 1), len);
            txt = c + d;
            var cont = txt.indexOf('<');
            if (a != b) {
                txt = this.noHtml(txt);
            }
            return (txt);
        };
        WidgetWIDetails.prototype.getWorkItemColor = function (workItemType) {
            var witColor = "";
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
        };
        WidgetWIDetails.prototype.getStateColor = function (state) {
            var statecolor = "";
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
        };
        WidgetWIDetails.prototype.DeltaDate = function (date) {
            var now = Date.now();
            var past = date.getTime();
            var days = Math.floor((now - past) / (1000 * 60 * 60 * 24));
            var result = {
                days: days,
                text: ""
            };
            if (days > 365) {
                var years = Math.floor(days / 365);
                if (years === 1) {
                    result.text = "A year ago";
                }
                else {
                    result.text = years + " year(s) ago";
                }
            }
            else if (days > 30) {
                var months = Math.floor(days / 30);
                if (months === 1) {
                    result.text = "A month ago";
                }
                else {
                    result.text = months + " month(s) ago";
                }
            }
            else if (days > 7) {
                result.text = "This month";
            }
            else if (days <= 7 && days > 1) {
                result.text = days + " days ago";
            }
            else if (days === 1) {
                result.text = "Yesterday";
            }
            else {
                result.text = "Today";
            }
            return result;
        };
        WidgetWIDetails.prototype.getMemberAvatarUrl = function (memberIdentity) {
            var i = memberIdentity.lastIndexOf("<");
            var j = memberIdentity.lastIndexOf(">");
            var uniqueName = $.trim(memberIdentity.substr(i + 1, j - i - 1));
            return VSS.getWebContext().host.uri + "_api/_common/IdentityImage?id=&identifier=" + uniqueName;
        };
        //Load and Reload Methods
        WidgetWIDetails.prototype.load = function (widgetSettings) {
            return this.LoadWIDetails(widgetSettings);
        };
        WidgetWIDetails.prototype.reload = function (widgetSettings) {
            return this.LoadWIDetails(widgetSettings);
        };
        return WidgetWIDetails;
    })();
    exports.WidgetWIDetails = WidgetWIDetails;
});
//# sourceMappingURL=app.js.map