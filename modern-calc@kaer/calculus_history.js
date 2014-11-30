/*
 *    Copyright (C) 2014  Kaer 
 *
 *    This program is free software; you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation; either version 2 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License along
 *    with this program; if not, write to the Free Software Foundation, Inc.,
 *    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 *    
 *    Modern Calc 0.0.1, Kaer (C) 2014 Kaer
 *    Modern Calc comes with ABSOLUTELY NO WARRANTY.
 *
 *    Author: Kaer (the.thin.king.way+2014@gmail.com)
 *    Project url: https://github.com/kaer/gnome-shell-extension-modern-calc
 *
 */

const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Panel = imports.ui.panel;
const Params = imports.misc.params;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;

const Me = ExtensionUtils.getCurrentExtension();


const CalculusHistory = new Lang.Class({
    Name: "CalculusHistory",
    
    _init: function(params) {
        this.params = Params.parse(params, {
            calc_app: false,
        });

        this.actor = new St.BoxLayout({
            style_class: 'history-group',
            vertical: true
        });

        this._prepareInterface();
        this._calculus_history = false;
        this._historyPos = undefined;

        this._refreshUI();
    },

    _prepareInterface: function(){

        this._historyTitle = new St.Label({
            style_class: 'history-title',
            text: 'History',
            visible: true
        });

        this.actor.add_child(this._historyTitle, { 
            expand: true,
            y_align: St.Align.START,
            x_align: St.Align.START
        });

        // buttons
        this._btnHistClear = new St.Button({
            label: 'clear history', style_class: 'history-btn-clear'
        });

        this._btnHistClear.connect("clicked", Lang.bind(this, this._clearCalculusHistory));
        /*
        this._btnClose = new St.Button({
            label: 'Close', style_class: 'history-btn-close'
        });*/

        // history buttons
        this._btnHistMovPrev = new St.Button({
            label: 'prev', style_class: 'history-btn-mover'
        });
        this._btnHistMovPrev.connect("clicked", Lang.bind(this, this._historyMovePrev));

        this._btnHistMovNext = new St.Button({
            label: 'next', style_class: 'history-btn-mover'
        });
        this._btnHistMovNext.connect("clicked", Lang.bind(this, this._historyMoveNext));


        this._ansTitle = new St.Label({
            style_class: 'ans-label',
            text: 'ANS',
            visible: true
        });

        this._ansValue = new St.Label({
            style_class: 'ans-value',
            text: '',
            visible: true
        });

        // containers
        this._hideableContainer = new St.BoxLayout({
            style_class: 'history-container',
            vertical: true
        });

        this._buttonContainer = new St.BoxLayout({
            style_class: 'button-container',
            vertical: false
        });

        this._ansContainer = new St.BoxLayout({
            style_class: 'ans-container',
            vertical: false
        });

        this._buttonContainer.add(this._btnHistClear, { 
            expand: true,
            y_align: St.Align.START,
            x_align: St.Align.START
        });
        /*
        this._buttonContainer.add(this._btnClose, { 
            expand: true,
            y_align: St.Align.START,
            x_align: St.Align.START
        });*/

        this._buttonContainer.add(this._btnHistMovPrev, { 
            expand: false,
            y_align: St.Align.START,
            x_align: St.Align.START
        });

        this._buttonContainer.add(this._btnHistMovNext, { 
            expand: false,
            y_align: St.Align.START,
            x_align: St.Align.START
        });


        this._ansContainer.add(this._ansTitle, { 
            expand: false,
            y_align: St.Align.START,
            x_align: St.Align.START
        });
        this._ansContainer.add(this._ansValue, { 
            expand: true,
            y_align: St.Align.START,
            x_align: St.Align.START
        });

        

        this._hideableContainer.add(this._buttonContainer, { 
            expand: true,
            y_align: St.Align.START,
            x_align: St.Align.START
        });

        this._hideableContainer.add(this._ansContainer, { 
            expand: true,
            y_align: St.Align.START,
            x_align: St.Align.START
        });
        

        this.actor.add_child(this._hideableContainer, { 
            expand: true,
            y_align: St.Align.START,
            x_align: St.Align.START
        });

    },
   
    _refreshUI: function(){

        let response = 'undefined';

        if(this._historyPos!= undefined && this._calculus_history){
            let histItem = this._getHistoryItem(this._historyPos);
            if(histItem != undefined){
                response = histItem.result;
            }
        }
        //TODO see a way to disable buttons
        //this._historyMovePrev.set_active(false);
        //this._historyMoveNext.set_active(false);
        //this._btnHistClear.set_active(false);

        this._ansValue.text = response;
    },

    _historyMovePrev: function(){
        
    },

    _historyMoveNext: function(){
        
    },


    _getHistoryItem: function(index){
        let hist = this._calculus_history;

        if(hist && index != undefined && index >=0){
            // check valid limits
            if(hist.length>0 && index < hist.length){
                return hist[index];
            }
        }
        return undefined;
    },

    _showLastHistoryItem: function(){
        if(this._calculus_history){
            if(this._calculus_history.length == 0){
                this._historyPos = undefined;
            }else {
                this._historyPos = this._calculus_history.length-1;    
            }
        }

        this._refreshUI();
    },

    push_calculus: function(calc_object){

        if(this._calculus_history == false){  //TODO ver se é feito dessa forma
            this._calculus_history = new Array();
        }

        if(calc_object != undefined && 
            calc_object.hasOwnProperty('expression') && 
            calc_object.hasOwnProperty('result')
            ){

            // pushes to history an obj like: 
            // {'expression': '10+44', 'result': '54', 'ans': 15 }
            this._calculus_history.push({
                expression: calc_object.expression,
                result: calc_object.result,
                ans: this.last_calculus_answer()
            });


            this._showLastHistoryItem();
        }
    },

    _clearCalculusHistory: function(){
        this._calculus_history = false;
        this._historyPos = undefined;

        this._refreshUI();
    },

    last_calculus_answer: function(){
        if(this._calculus_history == false || this._calculus_history.length == 0){
            return undefined;
        } else {
            return this._calculus_history[this._calculus_history.length-1].result;
        }
    },

    destroy: function(){
        this.actor.destroy();
    }

});

//Signals.addSignalMethods(CalculusHistory.prototype);
