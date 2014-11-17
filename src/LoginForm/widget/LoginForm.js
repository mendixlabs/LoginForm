/**

	LoginForm
	========================

	@file      : LoginForm.js
	@version   : 1.0
	@author    : ...
	@date      : 22-08-2014
	@copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004

	Documentation
    ========================
	Describe your widget here.

*/

(function() {
    'use strict';

    // test
    require([

        'mxui/widget/_WidgetBase', 'dijit/_Widget', 'dijit/_TemplatedMixin',
        'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/on', 'dojo/_base/lang', 'dojo/_base/declare', 'dojo/text', 'dojo/dom-attr',
        'dojo/_base/event'

    ], function (_WidgetBase, _Widget, _Templated, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, on, lang, declare, text, attr, event) {

        // Provide widget.
        dojo.provide('LoginForm.widget.LoginForm');

        // Declare widget.
        return declare('LoginForm.widget.LoginForm', [ _WidgetBase, _Widget, _Templated ], {

            /**
             * Internal variables.
             * ======================
             */
            _handle: null,

            // Extra variables
            _userInput 		: null,
            _passInput 		: null,

            indicator		: null,
            i18nmap			: null,

            // Template path
            templatePath: require.toUrl('LoginForm/widget/templates/LoginForm.html'),

            /**
             * Mendix Widget methods.
             * ======================
             */

            // DOJO.WidgetBase -> PostCreate is fired after the properties of the widget are set.
            postCreate: function () {

                // postCreate
                console.log('LoginForm - postCreate');

                // Setup widgets
                this._setupWidget();

                // Setup events
                this._setupEvents();

            },

            // DOJO.WidgetBase -> Startup is fired after the properties of the widget are set.
            startup: function () {
                // postCreate
                console.log('LoginForm - startup');
            },

            /**
             * What to do when data is loaded?
             */

            update: function (obj, callback) {
                // startup
                console.log('LoginForm - update');

                // Execute callback.
                callback && callback();
            },

            /**
             * How the widget re-acts from actions invoked by the Mendix App.
             */
            suspend: function () {
                //TODO, what will happen if the widget is suspended (not visible).
            },

            resume: function () {
                //TODO, what will happen if the widget is resumed (set visible).
            },

            enable: function () {
                //TODO, what will happen if the widget is suspended (not visible).
            },

            disable: function () {
                //TODO, what will happen if the widget is resumed (set visible).
            },

            unintialize: function () {
                
            },


            /**
             * Extra setup widget methods.
             * ======================
             */
            _setupWidget: function () {
                
                //Setup controls
                this._userInput = this.usernameInput;
                this._passInput = this.passwordInput;
                
                attr.set(this._userInput,"placeholder",this.userexample);
                attr.set(this._passInput,"placeholder",this.passexample);

                // Setup text input elements
                this.submitButton.value = this.logintext;
		
                if(this.forgotmf)
                    this.forgotLink.innerHTML = this.forgottext;
                else
                    domStyle.set(this.forgotPane, "visibility", "hidden");
                                    
                domStyle.set(this.messageNode, "visibility", "hidden");
                
                this.getI18NMap();

                if (this.showprogress) {
                    this.indicator = mx.ui.getProgressIndicator("modal", this.progresstext);
                }		
		
                this.dofocus && this.focusNode();

            },

            // Create child nodes.
            _createChildNodes: function () {
                console.log('LoginForm - createChildNodes events');
            },

            // Attach events to newly created nodes.
            _setupEvents: function () {

                console.log('LoginForm - setup events');

                on(this.submitButton, "click", lang.hitch(this, function(e) {
                    logger.debug(this.id + ".submitForm");

                    var user = this._userInput.value;
                    var pass = this._passInput.value;

                    if(user && pass) {
                        this.indicator && this.indicator.start();

                        dojo.rawXhrPost({
                            url			: 'xas/',
                            mimetype	: "application/json",
                            contentType	: "application/json",
                            handleAs	: "json",
                            postData	: dojo.toJson({
                                action		: "login",
                                params		: {
                                    username	: user,
                                    password	: pass,
                                    locale		: ""
                                }
                            }),
                            handle		: lang.hitch(this, "_validate")
                        });
                    } else {
                        domStyle.set(this.messageNode, "visibility", "");
                        this.messageNode.innerHTML = this.emptytext; 
                    }

                    event.stop(e);

                    return false;

                })); 
                
                if(this.forgotmf)
                {
                    on(this.forgotLink,"click", lang.hitch(this, function(e) {
                        logger.debug(this.id + ".forgotPwd");

                        var action = this.forgotmf;

                        if(action) {
                            mx.xas.action({
                                actionname	: action,
                                callback	: function() {
                                    // ok	
                                },
                                error		: function() {
                                    logger.error(this.id + ".forgotPwd: Error while calling microflow");
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
            
            _validate : function(response, ioArgs) {
                logger.debug(this.id + ".validate");

                this.indicator && this.indicator.stop();

                //dojo.cookie("EXTENDCOOKIE", this.checkboxInput.checked, { expires: 365 });

                var i18nmap = this.i18nmap;
                var span = this.messageNode;

                switch(ioArgs.xhr.status) {
                    case 200 :
                        mendix.widget.hideTooltip();
                        mx.login();
                        break;
                    case 400 :
                    case 401 :
                        span.innerHTML = i18nmap.http401;
                        break;
                    case 402 :
                    case 403 :
                        span.innerHTML = i18nmap.http401;
                        break;
                    case 404 :
                        span.innerHTML = i18nmap.http404;
                        break;
                    case 500 :
                        span.innerHTML = i18nmap.http500;
                        break;
                    case 503 :
                        span.innerHTML = i18nmap.http503;
                        break;
                    default :
                        span.innerHTML = i18nmap.httpdefault;
                        break;
                }
                domStyle.set(this.messageNode, "visibility", "");
            },

            getI18NMap : function() {
                logger.debug(this.id + ".injectI18NMap");

                if (!window.i18n) {
                    dojo.xhrGet({
                        url			: "js/login_i18n.js",
                        handleAs	: "javascript",
                        sync		: true
                    });
                }

                this.i18nmap = window.i18nMap;
            },

            focusNode : function() {
                logger.debug(this.id + ".focusNode");

                setTimeout(lang.hitch(this, function() {
                    this.usernameInput.focus();
                }), 0);
            }
        })
    });

}());


