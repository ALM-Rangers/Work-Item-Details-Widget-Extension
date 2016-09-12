//---------------------------------------------------------------------
// <copyright file="configuration.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
//---------------------------------------------------------------------

/// <reference path='isettings.d.ts' />
/// <reference path='../typings/tsd.d.ts' />
"use strict";
import RestClient = require("TFS/Work/RestClient");
import CoreClient = require("TFS/Core/RestClient");
import CoreContracts = require("TFS/Core/Contracts");
import WorkContracts = require("TFS/Work/Contracts");
import RestClientWI = require("TFS/WorkItemTracking/RestClient");

export class Configuration {
    widgetConfigurationContext = null;

    $wiid = $('#wiid');
    public client = RestClient.getClient();
    public clientwi = RestClientWI.getClient();
    public clickOnSave = false;


    public _widgetHelpers;
    constructor(public WidgetHelpers) {
    }



    public load(widgetSettings, widgetConfigurationContext) {

        var _that = this;

        var $wiid = $("#wiid");
        var $btnsave = $('.btn-cta');

        this.widgetConfigurationContext = widgetConfigurationContext;


        var $errorSingleLineInput = $("#linewi .validation-error-text");


        var settings = JSON.parse(widgetSettings.customSettings.data);
        if (settings && settings.wiId) {
            $wiid.val(settings.wiId);
        } else {
            //first load
            $wiid.val("");
        }

        _that.$wiid.blur(() => {
            this.clientwi.getWorkItem($wiid.val()).then((wi) => {

                $errorSingleLineInput.parent().css("visibility", "hidden");

                _that.widgetConfigurationContext.notify(_that.WidgetHelpers.WidgetEvent.ConfigurationChange,
                    _that.WidgetHelpers.WidgetEvent.Args(_that.getCustomSettings()));

            }, (reject) => {
                if (reject.status = "404") {
                    $errorSingleLineInput.text("This Work item dosn't exist.");
                    $errorSingleLineInput.parent().css("visibility", "visible");
                    $('.btn-cta').attr("disabled", "disabled");

                    return _that.WidgetHelpers.WidgetStatusHelper.Failure();

                }
            });
        });
        return _that.WidgetHelpers.WidgetStatusHelper.Success();
    }



    private isValidWI(): IPromise<boolean> {
        var deferred = $.Deferred<boolean>();

        if ($("#wiid").val() != "") {
            var customSettings = this.getCustomSettings();

            this.clientwi.getWorkItem($("#wiid").val()).then((wi) => {
                deferred.resolve(true);
            }, (reject) => {
                if (reject.status = "404") {
                    deferred.resolve(false);
                }
            });
        } else {
            deferred.resolve(false);
        }

        return deferred.promise();
    }




    public getCustomSettings() {
        var result = { data: JSON.stringify(<ISettings>{ wiId: $("#wiid").val() }) };
        return result;
    }

    public onSave() {

        if ($("#wiid").val() != "") {
            var customSettings = this.getCustomSettings();
            return this.WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);

        } else {
            var $errorSingleLineInput = $("#linewi .validation-error-text");
            $errorSingleLineInput.text("This Work item Id is required");
            $errorSingleLineInput.parent().css("visibility", "visible");
            return this.WidgetHelpers.WidgetConfigurationSave.Invalid();
        }
    }
}


VSS.require(["TFS/Dashboards/WidgetHelpers"], (WidgetHelpers) => {
    WidgetHelpers.IncludeWidgetConfigurationStyles();
    VSS.register("widetailswidget-Configuration", () => {
        var configuration = new Configuration(WidgetHelpers);
        return configuration;
    })

    VSS.notifyLoadSucceeded();
});