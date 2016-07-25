/*global logger mendix*/
define([

    "mxui/widget/_WidgetBase", "dijit/_TemplatedMixin",
    "mxui/dom", "dojo/dom", "dojo/query", "dojo/dom-class", "dojo/dom-construct", "dojo/dom-style",
    "dojo/on", "dojo/_base/lang", "dojo/_base/declare",
    "dojo/text", "dojo/dom-attr", "dojo/request/xhr", "dojo/json",
    "dojo/_base/event", "dojo/html", "dojo/has",
    "dojo/text!LoginForm/widget/templates/LoginForm.html",
    "dojo/text!LoginForm/widget/templates/LoginFormWithoutShowPassword.html", "dojo/sniff"

], function (_WidgetBase, _TemplatedMixin, dom, dojoDom, dojoQuery, domClass, domConstruct, domStyle, dojoOn, dojoLang, declare, text, domAttr, dojoXhr, dojoJSON, dojoEvent, dojoHtml, dojoHas, template, templateWithoutShowPassword) {
    "use strict";
    // Declare widget.
    return declare("LoginForm.widget.LoginForm", [ _WidgetBase, _TemplatedMixin ], {

        // Template path
        templateString: "",

        // DOM Elements
        loginFormNode: null,
        alertMessageNode: null,
        usernameInputNode: null,
        passwordContainerNode: null,
        passwordInputNode: null,
        passwordVisibilityToggleButtonNode: null,
        submitButtonNode: null,
        forgotPasswordNode: null,
        forgotPasswordLinkNode: null,
        usernameLabelNode: null,
        passwordLabelNode: null,

        // Parameters configured in the Modeler.
        userexample: "Username",
        passexample: "Password",
        logintext: "Login",
        progresstext: "",
        emptytext: "No username or password given",
        forgottext: "Forgot your password?",
        showprogress: false,
        showPasswordView: true,
        showButtonCaption: "Show",
        hideButtonCaption: "Mask",
        showImage: "",
        hideImage: "",
        forgotmf: "",
        dofocus: false,
        convertCase: "none",
        autoCorrect: false,
        autoCapitalize: false,
        keyboardType: "text",
        showLabels: false,
        usernameLabel: "User name",
        passwordLabel: "Password",
        showLoginFailureWarning: false,
        loginFailureText: "Your account will be blocked for 5 minutes if login with the same username fails thrice!",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: null,
        _userInput : null,
        _passInput : null,
        _captionShow : "",
        _captionHide : "",

        _indicator : null,
        _i18nmap : null,
        _setup: false,
        _loginForm_FailedAttempts: 0,

        postMixInProperties: function () {
            logger.debug(this.id + ".postMixInProperties");
            if (this.showPasswordView === true) {
                this.templateString = template;
            } else {
                this.templateString = templateWithoutShowPassword;
            }

        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");

            this._getI18NMap();
            this._updateRendering();
            this._setupEvents();
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            mendix.lang.nullExec(callback);
        },

        _updateRendering: function () {
            logger.debug(this.id + "._updateRendering");

            domClass.add(this.alertMessageNode, "hide");
            this._addMobileOptions();
            this._showLabels();
            // Check if user wants to display the show-password toggle
            if (this.showPasswordView === true) {
                this._styleMaskPasswordButton();
                this._styleShowPasswordButton();
                domConstruct.place(this._captionShow, this.passwordVisibilityToggleButtonNode, "only");
            }

            this._setUsernameInputAttributes();
            this._forgotPasswordLink();

            // Captures focus for the input node. (Already automatically set, so can only if not done automatically)
            if (this.dofocus) {
                this._focusNode();
            }

        },
        /**
         * Conditionally sets the icon and caption of the show-password button
         * @private
         */
        _styleShowPasswordButton: function () {
            if (this.showImage) {
                this._captionShow = "<img src=\"" + this.showImage + "\" />";
            }

            if (this.showButtonCaption.trim() !== "") {
                if (this.showImage) {
                    this._captionShow += "&nbsp;";
                }
                this._captionShow += this.showButtonCaption;
            }
        },
        /**
         * Conditionally sets the icon and caption of the mask-password button
         * @private
         */
        _styleMaskPasswordButton: function () {
            if (this.hideImage) {
                this._captionHide = "<img src=\"" + this.hideImage + "\" />";
            }

            if (this.hideButtonCaption.trim() !== "") {
                if (this.hideImage) {
                    this._captionHide += "&nbsp;";
                }
                this._captionHide += this.hideButtonCaption;
            }
        },
        /**
         * Conditionally sets the Username node input attributes
         * e.g autocorrect, autocapitalize, text-transform
         * @private
         */
        _setUsernameInputAttributes: function () {
            if (this.autoCorrect) {
                domAttr.set(this.usernameInputNode, "autocorrect", "on");
            }
            if (this.autoCapitalize && this.convertCase !== "none") {
                domAttr.set(this.usernameInputNode, "autocapitalize", "on");
            }

            if (this.convertCase === "toLowerCase") {
                domStyle.set(this.usernameInputNode, "text-transform", "lowercase");
            } else if (this.convertCase === "toUpperCase") {
                domStyle.set(this.usernameInputNode, "text-transform", "uppercase");
            }// Else this.convertCase === "None", in which case, do nothing
        },
        /**
         * Shows or hides the forgot-password link
         * @private
         */
        _forgotPasswordLink: function () {
            if (this.forgotmf) {
                dojoHtml.set(this.forgotPasswordLinkNode, this.forgottext);
            } else {
                domClass.add(this.forgotPasswordNode, "hide");
            }
        },
        /**
         * Controls what happens when Login Fails based on the passed in response code
         * @param code
         * @private
         */
        _loginFailed : function(code) {
            logger.debug(this.id + "._loginFailed");
            var message = "";

            if (this._indicator) {
                mx.ui.hideProgress(this._indicator);
            }

            message = this.getStatusMessage(code);

            logger.warn("Login has failed with Code: " + code + " and Message: " + message);

            if(this.showLoginFailureWarning) {
                if(this._loginForm_FailedAttempts === 1) {
                    message += "</br>" + this.loginFailureText;
                }
                this._loginForm_FailedAttempts++;
            }

            dojoHtml.set(this.alertMessageNode, message);
            domClass.remove(this.alertMessageNode, "hide");
        },

        translate: function (str) {
            return window.i18nMap[str];
        },

        getStatusMessage: function (code) {
            return this.translate("http" + code) || this.translate("httpdefault");
        },

        _setupEvents: function () {
            logger.debug(this.id + "._setupEvents");

            this.own(dojoOn(this.loginFormNode, "submit", dojoLang.hitch(this, this._loginUser)));

            if (this.forgotmf) {
                this.own(dojoOn(this.forgotPasswordLinkNode, "click", dojoLang.hitch(this, this._forgotPassword)));
            }

            if(this.passwordVisibilityToggleButtonNode) {
                this.own(dojoOn(this.passwordVisibilityToggleButtonNode, "click", dojoLang.hitch(this, this.togglePasswordVisibility)));
            }
        },

        /**
        * Widget Interaction Methods.
        * ======================
        */

        /**
         * Attempts to login the user. Takes in an Event Parameter
         * @param e
         * @private
         */
        _loginUser: function(e) {
            logger.debug(this.id + ".submitForm");

            domClass.add(this.alertMessageNode, "hide");

            if (domAttr.get(this.passwordInputNode, "type") === "text") {
                this.togglePasswordVisibility();
            }

            var username = this._changeCase(this.usernameInputNode.value);
            var password = this.passwordInputNode.value;

            if (username && password) {
                if (this.showprogress) {
                    logger.debug("Showing Progress!!");
                    this._indicator = mx.ui.showProgress();
                }

                mx.login(username, password, function(response) {
                    // Login Successful
                }, dojoLang.hitch(this, function(response) {
                    this._loginFailed(response);
                }));

            } else {
                domClass.remove(this.alertMessageNode, "hide");
                this.alertMessageNode.innerHTML = this.emptytext;
            }

            dojoEvent.stop(e);

        },
        /**
         * Triggers Forgot-Password Microflow. Takes in an event parameter
         * @param e
         * @private
         */
        _forgotPassword: function(e) {
            logger.debug(this.id + "._forgotPassword");

            mx.data.action({
                params       : {
                    actionname : this.forgotmf
                },
                callback	: function() {
                    logger.debug("Forgot Password Microflow Triggered Successfully!");
                },
                error		: dojoLang.hitch(this, function(error) {
                    logger.error(this.id + "._forgotPassword: Error while calling microflow " + this.forgotmf, error);
                })
            });

            dojoEvent.stop(e);
        },
        /**
         * Show/hide the Password
         */
        togglePasswordVisibility : function () {
            if (domAttr.get(this.passwordInputNode, "type") === "password") {
                domAttr.set(this.passwordInputNode, "type", "text");
                dojoHtml.set(this.passwordVisibilityToggleButtonNode, this._captionHide);
            } else {
                domAttr.set(this.passwordInputNode, "type", "password");
                dojoHtml.set(this.passwordVisibilityToggleButtonNode, this._captionShow);
            }
        },

        _getI18NMap : function() {
            logger.debug(this.id + "._getI18NMap");

            if (!window.i18n) {
                dojoXhr(mx.appUrl + "js/login_i18n.js", {
                    handleAs: "javascript"
                }).then(dojoLang.hitch(this, function(data){
                    this._i18nmap = window.i18nMap;
                }), function(err){
                    logger.debug(this.id + "._getI18Map: Failed to get i18NMap!", err);
                }, function(evt){
                    // Handle a progress event from the request if the
                    // browser supports XHR2
                });
            }


        },
        /**
         * Changes the Case of the passed in username to either uppercase or lowercase
         * @param username
         * @private
         */
        _changeCase: function (username) {
            if (this.convertCase === "toUpperCase") {
                return username.toUpperCase();
            } else if  (this.convertCase === "toLowerCase") {
                return username.toLowerCase();
            }

            return username;
        },

        _focusNode : function() {
            logger.debug(this.id + "._focusNode");

            //Even with timeout set to 0, function code is made asynchronous
            setTimeout(dojoLang.hitch(this, function() {
                this.usernameInputNode.focus();
            }), 0);

        },
        /**
         * Detects if widget is running on mobile device and sets the available options e.g Keyboard Type
         * @private
         */
        _addMobileOptions: function () {
            if(dojoHas("ios") || dojoHas("android") || dojoHas("bb")) {
                domAttr.set(this.usernameInputNode, "type", this.keyboardType);
            }
        },
        /**
         * Handles whether to show/hide the Username and Password Labels
         * @private
         */
        _showLabels: function () {
            if(this.showLabels) {
                domClass.remove(this.usernameLabelNode, "hidden");
                domClass.remove(this.passwordLabelNode, "hidden");
            }
        }

    });
});

require(["LoginForm/widget/LoginForm"]);
