/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console */
/*mendix */
/*
    LoginForm
    ========================

    @file      : LoginForm.js
	@version   : 3.2
	@author    : Richard Edens, Roeland Salij, Pauline Oudeman
	@date      : 22-08-2014
	@copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
require([
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/text',
    'dojo/on', 'dojo/dom-attr', 'dojo/request', 'dojo/json', 'dojo/_base/event', 'dojo/text!LoginForm/widget/template/LoginForm.html'
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, lang, text, on, domAttr, dojoRequest, dojoJSON, event, widgetTemplate) {
    'use strict';

    // Declare widget's prototype.
    return declare('LoginForm.widget.LoginForm', [_WidgetBase, _TemplatedMixin], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        /**
         * Internal variables.
         * ======================
         */
        _handle: null,

        // Extra variables
        _userInput: null,
        _passInput: null,
        _captionShow: null,
        _captionHide: null,

        _indicator: null,
        _i18nmap: null,

        // Template path
        templatePath: require.toUrl('LoginForm/widget/templates/LoginForm.html'),

        /**
         * Mendix Widget methods.
         * ======================
         */

        // DOJO.WidgetBase -> PostCreate is fired after the properties of the widget are set.
        postCreate: function () {

            // Setup widgets
            this._setupWidget();

            // Setup events
            this._setupEvents();

        },

        // DOJO.WidgetBase -> Startup is fired after the properties of the widget are set.
        startup: function () {

        },

        /**
         * What to do when data is loaded?
         */

        update: function (obj, callback) {

            // Execute callback.
            if (typeof callback !== 'undefined') {
                callback();
            }
        },

        unintialize: function () {

        },


        /**
         * Extra setup widget methods.
         * ======================
         */
        _setupWidget: function () {
            var templateWithView = null,
                templateWithoutView = null;

            if (this.showImage) {
                this._captionShow = '<img src="' + this.showImage + '" id="' + this.id + '_image" />';
            } else {
                this._captionShow = '';
            }
            if (this.hideImage) {
                this._captionHide = '<img src="' + this.hideImage + '" id="' + this.id + '_image" />';
            } else {
                this._captionHide = '';
            }

            if (this.showButtonCaption !== '') {
                if (this.showImage) {
                    this._captionShow += '&nbsp;';
                }
                this._captionShow += this.showButtonCaption;
            }

            if (this.hideButtonCaption !== '') {
                if (this.hideImage) {
                    this._captionHide += '&nbsp;';
                }
                this._captionHide += this.hideButtonCaption;
            }

            templateWithView = '<div class="input-group">' +
                '    <input type="password" class="form-control password" id="' + this.id + '_password" />' +
                '    <div class="input-group-addon" id="' + this.id + '_view">' + this._captionShow + '</div>' +
                '</div>';
            templateWithoutView = '<input type="password" class="form-control password" id="' + this.id + '_password" />';

            //Setup controls
            this._userInput = this.usernameInput;
            domAttr.set(this._userInput, 'placeholder', this.userexample);

            if (this.showPasswordView === false) {
                this.passwordContainer.innerHTML = templateWithoutView;
            } else {
                this.passwordContainer.innerHTML = templateWithView;
                this.connect(dojoDom.byId(this.id + '_view'), 'click', lang.hitch(this, function () {
                    if (domAttr.get(this._passInput, 'type') === 'password') {
                        domAttr.set(this._passInput, 'type', 'text');
                        dojoDom.byId(this.id + '_view').innerHTML = this._captionHide;
                    } else {
                        domAttr.set(this._passInput, 'type', 'password');
                        dojoDom.byId(this.id + '_view').innerHTML = this._captionShow;
                    }
                }));
            }
            this._passInput = dojoDom.byId(this.id + '_password');

            domAttr.set(this._passInput, 'placeholder', this.passexample);

            if (this.autoCorrect) {
                domAttr.set(this._userInput, 'autocorrect', 'on');
            }
            if (this.autoCapitalize) {
                domAttr.set(this._userInput, 'autocapitalize', 'on');
            }


            // Setup text input elements
            this.submitButton.value = this.logintext;

            if (this.forgotmf) {
                this.forgotLink.innerHTML = this.forgottext;
            } else {
                domStyle.set(this.forgotPane, 'display', 'none');
            }

            domStyle.set(this.messageNode, 'display', 'none');

            if (this.showprogress) {
                this._indicator = mx.ui.getProgressIndicator('modal', this.progresstext);
            }

            if (typeof this.dofocus !== 'undefined' && this.dofocus) {
                this._focusNode();
            }

        },


        // Attach events to newly created nodes.
        _setupEvents: function () {

            on(this.submitButton, 'click', lang.hitch(this, function (e) {

                var user = null,
                    pass = null,
                    promise = null;

                domStyle.set(this.messageNode, 'display', 'none');

                if (domAttr.get(this._passInput, 'type') === 'text') {
                    domAttr.set(this._passInput, 'type', 'password');
                    dojoDom.byId(this.id + '_view').innerHTML = this._captionShow;
                }

                console.log(this.id + '.submitForm');

                user = this._userInput.value;
                pass = this._passInput.value;

                if (user && pass) {
                    if (typeof this._indicator !== 'undefined' && this._indicator) {
                        this._indicator.start();
                    }

                    mx.server.request({
                        request: {
                            action: "login",
                            params: {
                                username: user,
                                password: pass,
                                locale: ""
                            }
                        },
                        options: {
                            callback: lang.hitch(this, function(state, response){
                                this._indicator.stop();
                                //Login successful, Page does not reload
                            }),
                            error: function (e) {
                                this.messageNode.innerHTML = e.message; // is only reached when xhrstatus !== 200
                                domStyle.set(this.messageNode, 'display', 'block');
                            }
                        }
                    });

                } else {
                    domStyle.set(this.messageNode, 'display', 'block');
                    this.messageNode.innerHTML = this.emptytext;
                }

                event.stop(e);

                return false;

            }));

            if (this.forgotmf) {
                on(this.forgotLink, 'click', lang.hitch(this, function (e) {
                    console.log(this.id + '.forgotPwd');

                    var action = this.forgotmf;

                    if (action) {
                        mx.data.action({
                            params: {
                                actionname: action
                            },
                            callback: function () {
                                // ok	
                            },
                            error: function () {
                                console.log(this.id + '.forgotPwd: Error while calling microflow');
                            }
                        });
                    }

                    event.stop(e);
                }));
            }
        },


        /**
         * Interaction widget methods.
         * ======================
         */
        _loadData: function () {
            // TODO, get aditional data from mendix.
        },


        _focusNode: function () {
            console.log(this.id + '.focusNode');

            setTimeout(lang.hitch(this, function () {
                this.usernameInput.focus();
            }), 0);
        }
    });
});