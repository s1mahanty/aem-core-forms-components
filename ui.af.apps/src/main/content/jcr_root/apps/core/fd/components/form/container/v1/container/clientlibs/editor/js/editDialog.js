/*******************************************************************************
 * Copyright 2022 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function($, Granite, channel, Coral) {
    "use strict";

    var EDIT_DIALOG = ".cmp-adaptiveform-container__editdialog",
        EDIT_DIALOG_FORM = ".cmp-adaptiveform-formcontainer__editdialog",
        EDIT_DIALOG_FRAGMENT = ".cmp-adaptiveform-fragmentcontainer__editdialog",
        CONTAINER_ENABLEASYNCSUBMISSION = ".cmp-adaptiveform-container__enableasyncsubmission",
        CONTAINER_THANKYOUOPTION = ".cmp-adaptiveform-container__thankyouoption",
        CONTAINER_REDIRECT = ".cmp-adaptiveform-container__redirect",
        CONTAINER_SUBMITACTION = ".cmp-adaptiveform-container__submitaction",
        CONTAINER_SUBMITACTION_SETTINGS = ".cmp-adaptiveform-container__submitactionsettings",
        CONTAINER_SUBMITACTION_SETTINGS_WRAPPER = ".cmp-adaptiveform-container__submitactionsettingswrapper",
        CONTAINER_THANKYOUMESSAGE = ".cmp-adaptiveform-container__thankyoumessage",
        SUB_DIALOG_CONTENT = ".cq-dialog-content",
        SELECTED_SUBMIT_ACTION = ".cmp-adaptiveform-container__submitaction coral-select-item:selected",
        REST_END_POINT_SUBMIT_ACTION = "fd/af/components/guidesubmittype/restendpoint",
        REST_END_POINT_POST_CHECK_BOX = "coral-checkbox [name='./enableRestEndpointPost']",
        FDM_SUBMIT_ACTION = "fd/afaddon/components/actions/fdm",
        FDM_ENABLE_DOR_CHECK_BOX = "coral-checkbox [name='./enableDoRSubmission']",
        EMAIL_SUBMIT_ACTION = "fd/af/components/guidesubmittype/email",
        EMAIL_PARENT_SELECTOR = '.emailSubmitActionContainer',
        EMAIL_TOGGLE_SWITCH_SELECTOR = '.emailTemplateSwitch',
        EMAIL_TEMPLATE_FIELD_SELECTOR = '.emailTemplate',
        EMAIL_TEMPLATE_PATH_SELECTOR = '.externalTemplatePath',
        REST_ENDPOINT = ".rest",
        FDM = ".fdm",
        EMAIL = ".email",
        ENABLE_AUTO_SAVE = "[name='./fd:enableAutoSave']",
        AUTO_SAVE_STRATEGY_CONTAINER = ".cmp-adaptiveform-container__autoSaveStrategyContainer",

        Utils = window.CQ.FormsCoreComponents.Utils.v1;

    function handleAsyncSubmissionAndThankYouOption(dialog) {
        var containerAsyncSubmission = dialog.find(CONTAINER_ENABLEASYNCSUBMISSION)[0];
        var containerThankYouOption = dialog.find(CONTAINER_THANKYOUOPTION);
        var containerRedirect = dialog.find(CONTAINER_REDIRECT);
        var containerThankYouMessage = dialog.find(CONTAINER_THANKYOUMESSAGE);
        if (containerAsyncSubmission) {
            var isNotChecked = function() {return !isChecked()};
            var isChecked = function() {return containerAsyncSubmission.checked};
            var hideAndShowElements = function() {
                // hide other elements
                Utils.checkAndDisplay(containerThankYouOption)(isChecked);
                // show rich text
                Utils.checkAndDisplay(containerRedirect)(isNotChecked);
            };
            containerAsyncSubmission.on("change", function() {
                hideAndShowElements();
            });
            hideAndShowElements();
        }
        if (containerThankYouOption.length > 0) {
            var isThankYouOptionAMessage = function() {return (Utils.getSelectedRadioGroupOption(containerThankYouOption) === "message");};
            var isThankYouOptionPage = function() {return !isThankYouOptionAMessage();};
            // show thank you message if async submission and thank you option is set to "message"
            channel.on("change", EDIT_DIALOG + " " + CONTAINER_THANKYOUOPTION, function(e) {
                Utils.checkAndDisplay(containerThankYouMessage)(isThankYouOptionAMessage);
                Utils.checkAndDisplay(containerRedirect)(isThankYouOptionPage);
            });
            Utils.checkAndDisplay(containerThankYouMessage)(isThankYouOptionAMessage);
            Utils.checkAndDisplay(containerRedirect)(isThankYouOptionPage);
        }
    }

    function handleSubmitAction(dialog) {
        var containerSubmitAction = dialog.find(CONTAINER_SUBMITACTION),
            containerSubmitActionSettings = dialog.find(CONTAINER_SUBMITACTION_SETTINGS),
            containerSubmitActionSettingsWrapper = dialog.find(CONTAINER_SUBMITACTION_SETTINGS_WRAPPER);
        if (containerSubmitAction.length > 0) {
            // remove the deprecated submit action
            // this is done in client so that deprecated submit action could still work if configured in form
            containerSubmitAction.find('coral-select-item[data-deprecated="true"]').filter(function () {
                return $(this).prop('selected') === false;
            }).remove();
            // render the sub dialog
            var renderSubDialog = Utils.renderSubDialog(containerSubmitActionSettings[0]);
            var showHideWrapper = function(show){if (show){containerSubmitActionSettingsWrapper.show()} else{containerSubmitActionSettingsWrapper.hide()}};
            renderSubDialog(containerSubmitAction[0].value, showHideWrapper);
            containerSubmitAction[0].on("change", function(){
                renderSubDialog(containerSubmitAction[0].value, showHideWrapper);
            });
        }
    }

    function registerSubmitActionSubDialogClientLibs(dialog) {
        var containerSubmitAction = dialog.find(CONTAINER_SUBMITACTION)[0];
        containerSubmitAction.on("change", function(){
            registerRestEndPointDialogClientlibs(dialog);
            registerFDMDialogClientlibs(dialog);
            registerEmailDialogClientlibs(dialog);
        });
    }

    function showDorBindRefSelector (dialog) {
        var enableDORSubmissionCheckBoxElement = dialog.find(FDM_ENABLE_DOR_CHECK_BOX)[0],
            $dorBindRefSelector = Utils.selectElement("input", './bindRef').parent();
        if (enableDORSubmissionCheckBoxElement != null && enableDORSubmissionCheckBoxElement.checked == true) {
            $dorBindRefSelector.parent().show();
        } else {
            $dorBindRefSelector.parent().hide();
        }
    }

    function showPostUrlTextField(dialog) {
        let enableRestEndpointCheckboxElement = dialog.find(REST_END_POINT_POST_CHECK_BOX)[0],
            restEndPointSource = Utils.selectElement("coral-radio", './restEndPointSource'), isPostUrlSelected = false,
            restEndPointUrlTextBox = Utils.selectElement("input", './restEndpointPostUrl')[0],
            restEndpointConfigPath = Utils.selectElement("input", './restEndpointConfigPath')[0];

        if (enableRestEndpointCheckboxElement != null && enableRestEndpointCheckboxElement.checked == true) {
            restEndPointSource.parent('div').parent('div').show();
            Utils.showComponent(restEndPointSource, 'div');
            restEndPointSource.each(function (i, obj) {
                if (obj.checked && obj.value === "posturl") {
                    isPostUrlSelected = true;
                }
            });
            if(restEndPointSource.length == 0 || isPostUrlSelected){
                Utils.showComponent(restEndPointUrlTextBox, 'div');
                Utils.hideComponent(restEndpointConfigPath, 'div');
                restEndPointUrlTextBox?.setAttribute("data-rest-endpoint-url-validation", "");
            } else {
                Utils.showComponent(restEndpointConfigPath, 'div');
                Utils.hideComponent(restEndPointUrlTextBox, 'div');
                restEndPointUrlTextBox?.removeAttribute("data-rest-endpoint-url-validation");
            }
        } else {
            Utils.hideComponent(restEndPointSource, 'div');
            Utils.hideComponent(restEndPointUrlTextBox, 'div');
            Utils.hideComponent(restEndpointConfigPath, 'div');
            restEndPointSource.parent('div').parent('div').hide();
            restEndPointUrlTextBox?.removeAttribute("data-rest-endpoint-url-validation");
        }
    }

    function showExternalTemplateInput(dialog) {
        var $toggleSwitch = $(EMAIL_PARENT_SELECTOR).find(EMAIL_TOGGLE_SWITCH_SELECTOR)[0];
        var $templateStringField = $(EMAIL_PARENT_SELECTOR).find(EMAIL_TEMPLATE_FIELD_SELECTOR)[0];
        var $templatePathField = $(EMAIL_PARENT_SELECTOR).find(EMAIL_TEMPLATE_PATH_SELECTOR)[0];
        if (!$toggleSwitch) {
            return;
        }

        // doing this because in the backend email template path has priority over inline template
        if (!$toggleSwitch.checked) {
            $templateStringField.parentElement.hidden = false;
            $templatePathField.parentElement.hidden = true;
        } else {
            // fall back to this if switch is not defined or toggle is on
            $templateStringField.parentElement.hidden = true;
            $templatePathField.parentElement.hidden = false;
        }
    }

    function registerRestEndPointDialogClientlibs(dialog) {
        var $subDialogContent = dialog.find(SUB_DIALOG_CONTENT);
        var selectedSubmitAction = $(SELECTED_SUBMIT_ACTION).val();
        if(selectedSubmitAction === REST_END_POINT_SUBMIT_ACTION) {
            var restCheckBox = dialog.find(REST_END_POINT_POST_CHECK_BOX);
            $subDialogContent.on('foundation-contentloaded', function() {
                showPostUrlTextField(dialog);
            });
            showPostUrlTextField(dialog);
            $(document).off('change' + REST_ENDPOINT).on('change' + REST_ENDPOINT, restCheckBox, function(){
                showPostUrlTextField(dialog);
            });
            registerRestEndpointUrlValidator();
        }
    }

    function registerFDMDialogClientlibs(dialog) {
        var $subDialogContent = dialog.find(SUB_DIALOG_CONTENT);
        var selectedSubmitAction = $(SELECTED_SUBMIT_ACTION).val();
        if(selectedSubmitAction === FDM_SUBMIT_ACTION) {
            var fdmDorCheckBox = dialog.find(FDM_ENABLE_DOR_CHECK_BOX);
            $subDialogContent.on('foundation-contentloaded', function() {
                showDorBindRefSelector(dialog);
            });
            showDorBindRefSelector(dialog);
            $(document).off('change' + FDM).on('change' + FDM, fdmDorCheckBox, function(){
                showDorBindRefSelector(dialog);
            });
        }
    }

    function registerEmailDialogClientlibs(dialog) {
        var $subDialogContent = dialog.find(SUB_DIALOG_CONTENT);
        var selectedSubmitAction = $(SELECTED_SUBMIT_ACTION).val();
        if(selectedSubmitAction === EMAIL_SUBMIT_ACTION) {
            var useExternalEmailTemplateSwitch = $(EMAIL_PARENT_SELECTOR).find(EMAIL_TOGGLE_SWITCH_SELECTOR);
            $subDialogContent.on('foundation-contentloaded', function() {
                showExternalTemplateInput(dialog);
            });
            showExternalTemplateInput(dialog);
                $(document).off('change' + EMAIL).on('change' + EMAIL, useExternalEmailTemplateSwitch, function(){
                showExternalTemplateInput(dialog);
            });
        }
    }

    function showHideAutoSave(dialog) {
        var enableAutoSave = dialog.find(ENABLE_AUTO_SAVE);
        if (enableAutoSave[0]) {
            var autoSaveStrategyContainer = dialog.find(AUTO_SAVE_STRATEGY_CONTAINER);
            if (autoSaveStrategyContainer) {
                if (enableAutoSave[0].checked) {
                    autoSaveStrategyContainer.show();
                } else {
                    autoSaveStrategyContainer.hide();
                }
            }
        }
    }

    function registerAutoSaveDialogAction(dialog) {
        var $subDialogContent = dialog.find(SUB_DIALOG_CONTENT);
        $subDialogContent.on('foundation-contentloaded', function() {
            showHideAutoSave(dialog);
        });
        showHideAutoSave(dialog);
        $(document).on('change', ENABLE_AUTO_SAVE, function () {
            showHideAutoSave(dialog);
        });
    }

    const initialiseDataModel = window.CQ.FormsCoreComponents.Utils.DataModel.initialiseDataModel;

    function registerRestEndpointUrlValidator() {
        $(window).adaptTo("foundation-registry").register("foundation.validation.validator", {
            selector: "[data-rest-endpoint-url-validation]",
            validate: (el) => {
                const url = el.value;
                // Regex to validate absolute URLs starting with http:// or https:// only
                const absoluteUrlPattern = /^https?:\/\/.+$/i;
                if (!absoluteUrlPattern.test(url)) {
                    return Granite.I18n.getMessage(
                       "Please enter the absolute path of the REST endpoint."
                    );
                }
            }
        });
    }

    Utils.initializeEditDialog(EDIT_DIALOG_FORM)(handleAsyncSubmissionAndThankYouOption, handleSubmitAction,
        registerSubmitActionSubDialogClientLibs, registerRestEndPointDialogClientlibs, registerFDMDialogClientlibs, registerEmailDialogClientlibs, initialiseDataModel, registerAutoSaveDialogAction);

    Utils.initializeEditDialog(EDIT_DIALOG_FRAGMENT)(initialiseDataModel);

})(jQuery, Granite, jQuery(document), Coral);
