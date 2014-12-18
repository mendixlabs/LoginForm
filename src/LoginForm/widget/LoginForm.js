/*jslint white: true nomen: true plusplus: true */
/*global mx, mxui, mendix, dojo, require, console, define, module, logger */
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
        'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/on', 'dojo/_base/lang', 'dojo/_base/declare', 'dojo/text', 'dojo/dom-attr', 'dojo/request/xhr', 'dojo/_base/json',
        'dojo/_base/event'

    ], function (_WidgetBase, _Widget, _Templated, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, on, lang, declare, text, attr, xhr, dojoJSON, event) {

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
            _userInput : null,
            _passInput : null,
            _captionShow : null,
            _captionHide : null,

            _indicator : null,
            _i18nmap : null,

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
                if (typeof callback !== 'undefined') {
                    callback();
                }
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
                var templateWithView = null,
                    templateWithoutView = null;
                
                if (this.showImage){
                    this._captionShow = '<img src="' + this.showImage + '" id="' + this.id + '_image" />';
                    this._captionHide = '<img src="' + this.hideImage + '" id="' + this.id + '_image" />';
                }
                    
                if (this.useCaptionView){
                    this._captionShow += '&nbsp;' + this.showButtonCaption;
                    this._captionHide += '&nbsp;' + this.hideButtonCaption;
                }
                
                var templateWithView =      '<div class="input-group">' +
                                            '    <input type="password" class="form-control password" id="' + this.id + '_password" />' +
                                            '    <div class="input-group-addon" id="' + this.id + '_view">' + this._captionShow + '</div>' +
                                            '</div>',
                    templateWithoutView =   '<input type="password" class="form-control password" id="' + this.id + '_password" />';
                
                //Setup controls
                this._userInput = this.usernameInput;
                attr.set(this._userInput, 'placeholder', this.userexample);
                
                if(this.showPasswordView === false){
                    this.passwordContainer.innerHTML = templateWithoutView;
                } else {
                    this.passwordContainer.innerHTML = templateWithView;
                    this.connect(dom.byId(this.id + '_view'), 'click', dojo.hitch(this, function(){
                        if (attr.get(this._passInput, 'type') === 'password') {
                            attr.set(this._passInput, 'type', 'text');
                            dom.byId(this.id + '_view').innerHTML = this._captionHide;
                        } else {
                            attr.set(this._passInput, 'type', 'password');
                            dom.byId(this.id + '_view').innerHTML = this._captionShow;
                        }
                    }));
                }
                this._passInput = dom.byId(this.id + '_password');
                
                attr.set(this._passInput, 'placeholder', this.passexample);
                
                if(this.autoCorrect){
                    attr.set(this._userInput, 'autocorrect', 'on');
                }
                if(this.autoCapitalize){
                    attr.set(this._userInput, 'autocapitalize', 'on');
                }

                
                // Setup text input elements
                this.submitButton.value = this.logintext;
		
                if (this.forgotmf) {
                    this.forgotLink.innerHTML = this.forgottext;
                } else {
                    domStyle.set(this.forgotPane, 'visibility', 'hidden');
                }
                domStyle.set(this.messageNode, 'visibility', 'hidden');
                
                this._getI18NMap();

                if (this.showprogress) {
                    this._indicator = mx.ui.getProgressIndicator('modal', this.progresstext);
                }		
		
                if (typeof this.dofocus !== 'undefined' && this.dofocus) { 
                    this._focusNode();
                }

            },

            // Create child nodes.
            _createChildNodes: function () {
                console.log('LoginForm - createChildNodes events');
            },

            // Attach events to newly created nodes.
            _setupEvents: function () {

                console.log('LoginForm - setup events');

                on(this.submitButton, 'click', lang.hitch(this, function(e) {
                    
                    var user = null,
                        pass = null,
                        promise = null;
                    
                    if (attr.get(this._passInput, 'type') === 'text') {
                        attr.set(this._passInput, 'type', 'password');
                        dom.byId(this.id + '_view').innerHTML = this._captionShow;
                    }
                    
                    logger.debug(this.id + '.submitForm');

                    user = this._userInput.value;
                    pass = this._passInput.value;

                    if(user && pass) {
                        if (typeof this._indicator !== 'undefined' && this._indicator){
                            this._indicator.start();
                        }

                        dojo.rawXhrPost({
                            url			: 'xas/',
                            mimetype	: 'application/json',
                            contentType	: 'application/json',
                            handleAs	: 'json',
                            headers     : {
                                'csrfToken' : mx.session.getCSRFToken()
                            },
                            postData	: dojoJSON.toJson({
                                action		: "login",
                                params		: {
                                    username	: user,
                                    password	: pass,
                                    locale		: ""
                                }
                            }),
                            handle		: lang.hitch(this, this._validate)
                        });
                        
                    } else {
                        domStyle.set(this.messageNode, 'visibility', '');
                        this.messageNode.innerHTML = this.emptytext; 
                    }

                    event.stop(e);

                    return false;

                })); 
                
                if(this.forgotmf)
                {
                    on(this.forgotLink, 'click', lang.hitch(this, function(e) {
                        logger.debug(this.id + '.forgotPwd');

                        var action = this.forgotmf;

                        if(action) {
                            mx.data.action({
                                params       : {
                                    actionname : action
                                },
                                callback	: function() {
                                    // ok	
                                },
                                error		: function() {
                                    logger.error(this.id + '.forgotPwd: Error while calling microflow');
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
                var i18nmap = null,
                    span = null;
                
                logger.debug(this.id + '.validate');

                if (typeof this._indicator !== 'undefined' && this._indicator) {
                    this._indicator.stop();
                }

                i18nmap = this._i18nmap;
                span = this.messageNode;

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
                domStyle.set(this.messageNode, 'visibility', '');
            },

            _getI18NMap : function() {
                logger.debug(this.id + '.injectI18NMap');

                if (!window.i18n) {
                    dojo.xhrGet({
                        url			: 'js/login_i18n.js',
                        handleAs	: 'javascript',
                        sync		: true
                    });
                }

                this._i18nmap = window.i18nMap;
            },

            _focusNode : function() {
                logger.debug(this.id + '.focusNode');

                setTimeout(lang.hitch(this, function() {
                    this.usernameInput.focus();
                }), 0);
            }
            
        });
    });

}());


