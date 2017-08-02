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
define(["require", "exports", "TFS/Work/RestClient", "TFS/WorkItemTracking/RestClient"], function (require, exports, RestClient, RestClientWI) {
    /// <reference path='isettings.d.ts' />
    /// <reference path='../typings/tsd.d.ts' />
    "use strict";
    var Configuration = (function () {
        function Configuration(WidgetHelpers) {
            this.WidgetHelpers = WidgetHelpers;
            this.widgetConfigurationContext = null;
            this.$wiid = $('#wiid');
            this.client = RestClient.getClient();
            this.clientwi = RestClientWI.getClient();
            this.clickOnSave = false;
        }
        Configuration.prototype.load = function (widgetSettings, widgetConfigurationContext) {
            var _this = this;
            var _that = this;
            var $wiid = $("#wiid");
            var $btnsave = $('.btn-cta');
            this.widgetConfigurationContext = widgetConfigurationContext;
            var $errorSingleLineInput = $("#linewi .validation-error-text");
            var settings = JSON.parse(widgetSettings.customSettings.data);
            if (settings && settings.wiId) {
                $wiid.val(settings.wiId);
            }
            else {
                //first load
                $wiid.val("");
            }
            _that.$wiid.blur(function () {
                _this.clientwi.getWorkItem($wiid.val()).then(function (wi) {
                    $errorSingleLineInput.parent().css("visibility", "hidden");
                    _that.widgetConfigurationContext.notify(_that.WidgetHelpers.WidgetEvent.ConfigurationChange, _that.WidgetHelpers.WidgetEvent.Args(_that.getCustomSettings()));
                }, function (reject) {
                    if (reject.status = "404") {
                        $errorSingleLineInput.text("This Work item dosn't exist.");
                        $errorSingleLineInput.parent().css("visibility", "visible");
                        $('.btn-cta').attr("disabled", "disabled");
                        return _that.WidgetHelpers.WidgetStatusHelper.Failure();
                    }
                });
            });
            return _that.WidgetHelpers.WidgetStatusHelper.Success();
        };
        Configuration.prototype.isValidWI = function () {
            var deferred = $.Deferred();
            if ($("#wiid").val() != "") {
                var customSettings = this.getCustomSettings();
                this.clientwi.getWorkItem($("#wiid").val()).then(function (wi) {
                    deferred.resolve(true);
                }, function (reject) {
                    if (reject.status = "404") {
                        deferred.resolve(false);
                    }
                });
            }
            else {
                deferred.resolve(false);
            }
            return deferred.promise();
        };
        Configuration.prototype.getCustomSettings = function () {
            var result = { data: JSON.stringify({ wiId: $("#wiid").val() }) };
            return result;
        };
        Configuration.prototype.onSave = function () {
            if ($("#wiid").val() != "") {
                var customSettings = this.getCustomSettings();
                return this.WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
            }
            else {
                var $errorSingleLineInput = $("#linewi .validation-error-text");
                $errorSingleLineInput.text("This Work item Id is required");
                $errorSingleLineInput.parent().css("visibility", "visible");
                return this.WidgetHelpers.WidgetConfigurationSave.Invalid();
            }
        };
        return Configuration;
    }());
    exports.Configuration = Configuration;
    VSS.require(["TFS/Dashboards/WidgetHelpers"], function (WidgetHelpers) {
        WidgetHelpers.IncludeWidgetConfigurationStyles();
        VSS.register("widetailswidget-Configuration", function () {
            var configuration = new Configuration(WidgetHelpers);
            return configuration;
        });
        VSS.notifyLoadSucceeded();
    });
});
//# sourceMappingURL=configuration.js.map