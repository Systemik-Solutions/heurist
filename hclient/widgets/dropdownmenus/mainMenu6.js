/**
* mainMenu6.js : main menu for v6
* 
* It loads mainMenu6_xxx.html for every section
* They took icons, titles and rollovers from mainMenu.js widget. Namely from mainMenuXXX.html files wish describe dropdown menues
* Action handlers are in mainManu.js as well. See menuActionById
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2020 University of Sydney
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @version     4.0
*/

/*
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except in compliance
* with the License. You may obtain a copy of the License at http://www.gnu.org/licenses/gpl-3.0.txt
* Unless required by applicable law or agreed to in writing, software distributed under the License is
* distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
* See the License for the specific language governing permissions and limitations under the License.
*/


$.widget( "heurist.mainMenu6", {

    // default options
    options: {
    },
    
    sections: ['design','import','explore','publish','admin'],
    //sections: ['admin','design','import','publish','explore'],
    
    menues:{}, //section menu - div with menu actions
    containers:{}, //operation containers (next to section menu)
    
    _myTimeoutId: 0, //delay on collapse main menu
    _myTimeoutId2: 0, //delay on close section menu
    _myTimeoutId3: 0, //delay on show explore section menu
    _myTimeoutId4: 0, //delay on close explore section menu
    _myTimeoutId5: 0, //delay on prevent expand main menu (after search)
    _myTimeoutId6: 0, //delay on close explore section menu for recordAdd
    
    _delayOnCollapseMainMenu: 800,
    _delayOnCollapse_SectionMenu: 600,
    _delayOnCollapse_ExploreMenu: 600,
    
    _delayOnShow_ExploreMenu: 250, //5 500,
    _delayOnShow_AddRecordMenu: 250, //10 1000,
    
    _widthMenu: 170,
    
    _is_prevent_expand_mainmenu: false,
    _explorer_menu_locked: false,
    _active_section: null,
    _current_explore_action: null,
    
    divMainMenu: null,  //main div
    search_faceted: null,
    edit_svs_dialog: null,
    
    currentSearch: null,
    reset_svs_edit: true,
    
    is_svslist_inline: true,
    svs_list: null,
    
    coverAll: null,


    // the widget's constructor
    _create: function() {

        var that = this;
        
        this.element.addClass('ui-menu6')
        .addClass('selectmenu-parent')
        .disableSelection();// prevent double click to select text

        this.coverAll = $('<div>').addClass('coverall-div-bare')
            .css({'background-color': '#000', opacity: '0.6',zIndex:102,  
            filter: 'progid:DXImageTransform.Microsoft.Alpha(opacity=60)'})
            .hide()
            .appendTo( this.element );
        //91 200    
        this.divMainMenu = $('<div>')
        .css({position:'absolute',width:'91px',top:'2px',left:'0px',bottom:'4px',
                cursor:'pointer','z-index':104})
        .appendTo( this.element )
        .load(
            window.hWin.HAPI4.baseURL+'hclient/widgets/dropdownmenus/mainMenu6.html',
            function(){ 

                that.divMainMenu.find('.menu-text').hide();

                //init all menues
                $.each(that.sections, function(i, section){
                    that._loadSectionMenu(section);
                });
                
                //explore menu in main(left) menu
                that._on(that.divMainMenu.children('.ui-heurist-header,.ui-heurist-explore'),{
                    mouseenter: that._expandMainMenuPanel,
                    //click: that._expandMainMenuPanel,
                    mouseleave: that._collapseMainMenuPanel,
                });
                that._on(that.element.find('span.section-head').parent(), {
                    mouseenter: that._expandMainMenuPanel, //mouseenter mouseover
                });
                
                //other entries in main(left) menu
                /* 
                remove these remarks to enable temp appearing section menu on mouse over 
                without it they can be opened by click only
                
                that._on(that.divMainMenu.children(':not(.ui-heurist-explore)'), {
                    mouseover: that._mousein_SectionMenu,  
                    mouseleave: that._mouseout_SectionMenu,
                });
                */
                //exit form explore menu section
                that._on(that.element.find('.ui-menu6-section.ui-heurist-explore'), {
                    mouseleave: that._collapseMainMenuPanel
                });


                that._on(that.divMainMenu.find('.ui-heurist-header'),{
                    click: that._openSectionMenu
                });

                
                if(window.hWin.HAPI4.sysinfo['db_total_records']<1){
                    //open explore by default, or "design" if db is empty
                    that._active_section = 'explore';
                    
                    that.containers['design']
                        .position({my:'center',at:'center',of:that.element})
                        //.css({top:that.element.height()/2-250,left:that.element.width()/2-250,width:500,height:500})
                        .css({width:500,height:400})
                        .load(window.hWin.HAPI4.baseURL+'hclient/widgets/dropdownmenus/welcome.html',
                            function(){
                               var url = window.hWin.HAPI4.baseURL+'?db='+window.hWin.HAPI4.database;
                               $('.bookmark-url').html('<a href="'+url+'">'+url+'</a>');
                               $('.template-url').attr('href', window.hWin.HAPI4.baseURL
                                                +'documentation_and_templates/db_design_template.rtf');
                            });
                    that.switchContainer( 'design', true );
                }else{
                    that.switchContainer( 'explore' );    
                }
                

                //moved to initSection that._updateDefaultAddRectype();
                that._createListOfGroups(); //add list of groups for saved filters
                
                that.divMainMenu.find('.menu-text').hide();
                
                //init explore menu items    .menu-explore > span, #filter_by_groups                                             
                that._on(that.divMainMenu.find('.menu-explore'),{ //, #filter_by_groups
                    mouseenter: that._mousein_ExploreMenu,
                    mouseleave: function(e){
                        if($(e.target).parent('#filter_by_groups').length==0){
                            clearTimeout(this._myTimeoutId3); this._myTimeoutId3 = 0; //clear timeout on show section menu
                            this._myTimeoutId2 = setTimeout(function(){
                                        that._closeSectionMenu('explore');
                                    },  this._delayOnCollapse_SectionMenu); //600
                        }
                    }
                });
                that._on(that.divMainMenu.find('#filter_by_groups'),{ //, #filter_by_groups
                    mouseenter: that._mousein_ExploreMenu,
                    mouseleave: function(e){
                            clearTimeout(this._myTimeoutId3); this._myTimeoutId3 = 0; //clear timeout on show section menu
                            this._myTimeoutId2 = setTimeout(function(){
                                        that._closeSectionMenu('explore');
                                    },  this._delayOnCollapse_SectionMenu); //600
                    }
                });
                
                //on exit out of window - keep menu open
                that._on(that.divMainMenu.find('.saved-filters'),{
                    click: that._show_ExploreMenu
                });
                
                //forcefully hide coverAll on click
                that._on(that.coverAll, {
                    click: function(){that._collapseMainMenuPanel(true);}
                });
                
                that._on($(document),{mouseleave: that._resetCloseTimers });
                
/*                
                that._on(that.divMainMenu.find('.menu-explore[data-action-onclick="svsAdd"]'), 
                {click: function(e){
                    that.addSavedSearch();
                }});
*/                
        });
        
        //that.initHelpDiv();

        $(window.hWin.document).on(window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE
                +' '+window.hWin.HAPI4.Event.ON_STRUCTURE_CHANGE
                +' '+window.hWin.HAPI4.Event.ON_REC_SEARCHSTART
                +' '+window.hWin.HAPI4.Event.ON_REC_SEARCH_FINISH, 
            function(e, data) {
              
                if(e.type == window.hWin.HAPI4.Event.ON_REC_SEARCHSTART){
                    
                    //not need to check realm since this widget the only per instance
                    //if(data && that.options.search_realm && that.options.search_realm!=data.search_realm) return;
                    
                    that.reset_svs_edit = true;
                    if(data && !data.increment && !data.reset){
                        //keep current search for "Save Filter"
                        that.currentSearch = window.hWin.HEURIST4.util.cloneJSON(data);
                        that._updateSaveFilterButton(1);

                        that.switchContainer('explore'); 
                        that._collapseMainMenuPanel(true, 1000);
                        
                    }else if(data.reset){
                        that.currentSearch = null;
                        that._updateSaveFilterButton(0);
                    }
                    
                }else if(e.type == window.hWin.HAPI4.Event.ON_REC_SEARCH_FINISH){
                    
                    //if(data && that.options.search_realm && that.options.search_realm!=data.search_realm) return;
                    that.coverAll.hide();
                    // window.hWin.HAPI4.currentRecordset is the same as data.recordset
                    if(data.recordset && data.recordset.length()>0){
                        that._updateSaveFilterButton(2);
                    }else{
                        that._updateSaveFilterButton(0);
                    } 
                    
                }else if(e.type == window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE){
                    if(data && data.origin=='recordAdd'){
                        that._updateDefaultAddRectype( data.preferences );
                    }else{
                        that._updateDefaultAddRectype();
                    }
                }else{
                    //if(e.type == window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE){}
                    //refresh list of rectypes afrer structure edit
                    that._updateDefaultAddRectype();
                }
        });
        
        
    }, //end _create
    
    //
    // 0 - disabled
    // 1 - search in progress
    // 2 - bounce and ready to save
    //
    _updateSaveFilterButton: function( mode ){
        
        var btn = this.divMainMenu.find('.menu-explore[data-action="svsAdd"]');
        
        if(mode==0){ //disabled
           
            
            //btn.hide();//
            btn.find('span.ui-icon')
                .removeClass('ui-icon-loading-status-lines rotate')
                .addClass('ui-icon-filter-plus');
            window.hWin.HEURIST4.util.setDisabled(btn, true);
            
        }else if(mode==1){ //search in progress
            
            //btn.show();
            btn.find('span.ui-icon')
                .removeClass('ui-icon-filter-plus')
                .addClass('ui-icon-loading-status-lines rotate');
        }else{
            
            window.hWin.HEURIST4.util.setDisabled(btn, false);
            //btn.show();
            
            btn.find('span.ui-icon')
                .removeClass('ui-icon-loading-status-lines rotate')
                .addClass('ui-icon-filter-plus');
          
            var that = this;       
            btn.effect( 'pulsate', null, 4000, function(){
                btn.css({'padding':'6px 2px 6px '+(that.divMainMenu.width()==that._widthMenu?16:30)+'px'});
                //btn.find('.section-head').css({'padding-left':(that.divMainMenu.width()==that._widthMenu?0:12)+'px'});
            } );
            
        }
        
        
        
    },
    
    //
    //  
    //
    _updateDefaultAddRectype: function( preferences ){
      
      var prefs = (preferences)?preferences:window.hWin.HAPI4.get_prefs('record-add-defaults');
      if($.isArray(prefs) && prefs.length>0){
            var rty_ID = prefs[0];
            //var ele = this.divMainMenu.find('.menu-explore[data-action="recordAdd"]');
            
            var ele = this.menues['import'].find('li[data-action="recordAdd"]');
            
            if(ele.length>0){

                if(rty_ID>0 && $Db.rty(rty_ID,'rty_Name')){
                    ele.find('.menu-text').css('margin-left',0).html('Add&nbsp;&nbsp; [<i>'
                            +window.hWin.HEURIST4.util.htmlEscape($Db.rty(rty_ID,'rty_Name'))+'</i>]');
                    ele.attr('data-id', rty_ID);
                    this._off(ele, 'click');
                    this._on(ele, {click: function(e){
                        var ele = $(e.target).is('li')?$(e.target):$(e.target).parents('li');
                        var rty_ID = ele.attr('data-id');
                        this.coverAll.hide();
                        window.hWin.HEURIST4.ui.openRecordEdit(-1, null,{new_record_params:{RecTypeID:rty_ID}});
                    }});
                }else{
                    ele.find('.menu-text').text('Add record');
                    ele.attr('data-id','');
                    this._off(ele, 'click');
                }
            
            }
      }
      
      var bm_on = (window.hWin.HAPI4.get_prefs('bookmarks_on')=='1');
      var ele = this.divMainMenu.find('.menu-explore[data-action="svs_list"][data-id="bookmark"]')
      if(bm_on) ele.show();
      else ele.hide();
      
    },
    
    _refresh: function(){
    },
    
    _destroy: function() {
        
        this.divMainMenu.remove();
        
        if(this.edit_svs_dialog) this.edit_svs_dialog.remove();
        if(this.search_faceted) this.search_faceted.remove();
        
        $(window.hWin.document).off(window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE
                +' '+window.hWin.HAPI4.Event.ON_STRUCTURE_CHANGE
                +' '+window.hWin.HAPI4.Event.ON_REC_SEARCHSTART
                +' '+window.hWin.HAPI4.Event.ON_REC_SEARCH_FINISH);
    },
    
    //
    //
    //
    _isExplorerMenu_locked: function(){
        
        var isSvsEditVisible = ( this.edit_svs_dialog && this.edit_svs_dialog.isModified() );
        //isSvsEditVisible = false;
//console.log('>>>'+isSvsEditVisible);        
        return (this._explorer_menu_locked    //isSvsEditVisible || 
                || this.element.find('.ui-selectmenu-open').length>0
                || $('.list_div').is(':visible')      //tag selector dropdown      
                || $('.ui-widget-overlay.ui-front').is(':visible')   //some modal dialog is open
                );
    },

    //
    // collapse main menu panel on explore mouseout
    //    
    _collapseMainMenuPanel: function(is_instant, is_forcefully) {

        var that = this;
        if(is_forcefully>0){
            this._is_prevent_expand_mainmenu = true;
            this._myTimeoutId5 = setTimeout(function() { that._is_prevent_expand_mainmenu = false },is_forcefully);
        }else if(this._isExplorerMenu_locked() ){
            return;  
        } 
        
        if(is_instant && this._myTimeoutId>0){
            clearTimeout(this._myTimeoutId);
        }
        clearTimeout(this._myTimeoutId3); this._myTimeoutId3 = 0;
        
        this._myTimeoutId = setTimeout(function() {
            that._myTimeoutId = 0;

            that.coverAll.hide();
            
            that.menues_explore_gap.hide();
            that.divMainMenu.find('.menu-text').hide();
            that.divMainMenu.find('ul').css({'padding-right':'30px'});
            that.divMainMenu.find('.menu-explore').css({padding:'6px 2px 6px 30px'});
            //that.divMainMenu.find('.menu-explore[data-action="recordAdd"]').css({padding:'0px 2px 6px 30px'});
            that.divMainMenu.find('.ui-heurist-header2').css({'text-align':'center'});
            that.divMainMenu.find('.section-head').css({'padding-left':'0px'});
            
            that.divMainMenu.find('#svs_list').hide();
            that.divMainMenu.find('#filter_by_groups').show();
            
            that.divMainMenu.stop().effect('size',  { to: { width: 91 } }, is_instant===true?10:300, function(){
                //that.divMainMenu.find('.menu-text').hide();
                that.divMainMenu.css({bottom:'4px',height:'auto'});
                that._closeSectionMenu('explore');
                //console.log(' _collapsed');                
                //that.divMainMenu.css({'box-shadow':null});
                if (that.menues[that._active_section]) 
                {
                    that.menues[that._active_section].css({left:96});
                }   
                
                
            });
        }, is_instant===true?10:this._delayOnCollapseMainMenu); //800
    },
    
    //
    // expand main menu panel on explore mouse in
    //
    _expandMainMenuPanel: function(e) {
//console.log(' _expandMainMenuPanel ' );
        if(this._is_prevent_expand_mainmenu) return;

        clearTimeout(this._myTimeoutId); //terminate collapse
        this._myTimeoutId = 0;
        if(this.divMainMenu.width()==this._widthMenu) return; //200 already expanded
        
        this.coverAll.show();
        
        var that = this;
        this._mouseout_SectionMenu();
        this.divMainMenu.stop().effect('size',  { to: { width: that._widthMenu } }, 300,
                function(){
                    that.divMainMenu.find('ul').css({'padding-right':'12px'});
                    that.divMainMenu.find('.ui-heurist-header2').css({'text-align':'left'});
                    that.divMainMenu.find('.section-head').css({'padding-left':'12px'});
                    that.divMainMenu.find('.menu-text').css({'display':'inline-block'}); //show('fade',300);
                    that.divMainMenu.css({bottom:'4px',height:'auto'});
                    that.divMainMenu.find('.menu-explore').css({padding:'6px 2px 6px 16px'});
                    //that.divMainMenu.find('.menu-explore[data-action="recordAdd"]').css({padding:'0px 2px 6px 16px'});
                    //that.divMainMenu.css({'box-shadow':'rgba(0, 0, 0, 0.5) 5px 0px 0px'});
                    
                    if(that.is_svslist_inline){
                        //change parent for cont? 
                        that.divMainMenu.find('#filter_by_groups').hide();

                        if(that.svs_list){
                            
                              if(!that.svs_list.parent().hasClass('ui-heurist-header2')){
                                //show in left main menu
                                that.svs_list.detach().appendTo(that.divMainMenu.find('.ui-heurist-header2'));
                                that.svs_list.css({'top':144, 'font-size':'0.8em'});
                                that.svs_list.svs_list('option','container_width',170);
                                that.svs_list.svs_list('option','hide_header', true);
                                that._on(that.svs_list,{mouseenter: that._resetCloseTimers});//_expandMainMenuPanel});
                            }
                            that.svs_list.show();
                        }else{
                            that.divMainMenu.find('#svs_list').show();
                            that.svs_list = that._init_SvsList(that.divMainMenu.find('#svs_list'));  
                            //that.svs_list.css({background:'none'})
                        } 
                        /*
                            that.svs_list.find('.svs-header').each(function(i,item)
                                    {
                                        $(item).css({'font-style':'italic','color':'red !important'});   
                                    });
                            that.svs_list.find('.ui-accordion-content').css({'color':'white !important'});
                        */
                    }
                    
                    if (!(that.containers[that._active_section] &&
                        that.containers[that._active_section].is(':visible'))) 
                    {
                        that.menues[that._active_section].css({left:that._widthMenu+5});
                    }   
                    
                });
    },
    
    //
    // leave active section
    //    
    _mouseout_SectionMenu: function(e) {
        
        if( this._isExplorerMenu_locked() ) return;
        
        var that = this;
        
        clearTimeout(this._myTimeoutId3); this._myTimeoutId3 = 0;
        //that.divMainMenu.find('li.menu-explore > .menu-text').css('text-decoration', 'none');
        
        function __closeAllsectionMenu() {
            
            var section_name = that._getSectionName(e);
            if(that._active_section!=section_name || that._active_section=='explore')
            {
                $.each(that.sections, function(i, section){
                    if(that._active_section!=section || that._active_section=='explore'){
                        that._closeSectionMenu(section); 
                    }
                });
            }
        }        
        
        if(e){
            this._myTimeoutId2 = setTimeout(__closeAllsectionMenu,this._delayOnCollapse_SectionMenu); // 600
        }else{
            __closeAllsectionMenu();
        }
    },
    
    //
    // show section menu on mouse over  NOT USED
    //
    _mousein_SectionMenu: function(e) {

        if( this._isExplorerMenu_locked() ) return;
        
        clearTimeout(this._myTimeoutId3); this._myTimeoutId3 = 0;
        clearTimeout(this._myTimeoutId2); this._myTimeoutId2 = 0;
        
        var section_name = this._getSectionName(e);
        
        if(true || this._active_section!=section_name ){
            //hide all except active
            var that = this;
            $.each(this.sections, function(i, section){
                if(section_name==section && that._active_section!=section){
                    if(section!='explore'){
                        that.menues[section].css('z-index',102).show('fade',{},500); //show over current section menu
                        that._collapseMainMenuPanel(true); 
                    }
                }else if(that._active_section!=section || that._active_section=='explore'){
                    that._closeSectionMenu(section);
                }
            });
            
        }
        
    },
    
    //
    // prevent close section and main menu
    //
    _resetCloseTimers: function(){

        clearTimeout(this._myTimeoutId4); this._myTimeoutId4 = 0; //delay close explore section menu
        clearTimeout(this._myTimeoutId2); this._myTimeoutId2 = 0; //delay on collapse main menu
        clearTimeout(this._myTimeoutId); this._myTimeoutId = 0; //delay on close section menu
    },
    //
    //
    //
    _mousein_ExploreMenu: function(e) {

        if( this._isExplorerMenu_locked() ) return;
        this._explorer_menu_locked = false;
        
        this._expandMainMenuPanel();

        clearTimeout(this._myTimeoutId3); this._myTimeoutId3 = 0;
        this._resetCloseTimers();
        this.divMainMenu.find('li.menu-explore > .menu-text').css('text-decoration', 'none');
        
        var ele, hasAction = false;
        
        if($(e.target).attr('id')=='filter_by_groups'){
            hasAction = false;
        }else{

            ele = $(e.target).is('li')?$(e.target):$(e.target).parents('li');
            if(ele){
                ele.find('.menu-text').css('text-decoration','underline');
                hasAction = ele.attr('data-action');
            }
        }

        if(hasAction){
            this._show_ExploreMenu(e);    
        } else {
            var that = this;
            this._myTimeoutId4 = setTimeout(function(){
                    that.menues['explore'].hide();
                    that.menues_explore_gap.hide();
            }, this._delayOnCollapse_ExploreMenu); //500
        }
    
        
    },
        
    //
    //
    //        
    _show_ExploreMenu: function(e) {
        
        var menu_item, action_name;

        if($(e.target).hasClass('saved-filters') || $(e.target).parent().hasClass('saved-filters')){
            action_name = 'svs_list';         
        }else{
            menu_item = $(e.target).is('li')?$(e.target):$(e.target).parents('li');
            action_name = menu_item.attr('data-action');
        }
        //action_name = menu_item.attr('data-action');
        
        if(this._current_explore_action==action_name) return;
        
        //AAAA this.menues['explore'].hide();
        //this.menues['explore'].find('.explore-widgets').hide();
        
        var that = this,
            expandRecordAddSetting = false,
            delay = this._delayOnShow_ExploreMenu; //500
            
        if(action_name == 'recordAdd'){
            if(menu_item.attr('data-id')>0){
                delay = this._delayOnShow_AddRecordMenu; //1000;
            }
        }else{
            that.menues['explore']
                    .removeClass('ui-heurist-import record-addition').addClass('ui-heurist-explore');

            if(action_name=='recordAddSettings'){
                action_name = 'recordAdd';
                expandRecordAddSetting = true;
            }
        }      

        //menu section has several containers with particular widgets
        var cont = this.menues['explore'].find('#'+action_name);
        //console.log('_mousein_ExploreMenu '+action_name+'  '+cont.length);            
        if(cont.length==0){
            cont = $('<div id="'+action_name+'" class="explore-widgets">').appendTo(this.menues['explore']);
        }else if( cont.is(':visible') && action_name!='svs_list'){
            return;
        }
        
        //cont.show();
        //var cont = this.menues['explore'];
        var explore_top = '2px',
        explore_height = 'auto',
        explore_left = this._widthMenu+4; //204;

        
        clearTimeout(this._myTimeoutId3); this._myTimeoutId3 = 0; 
        
        //delay before open explore section menu
        this._myTimeoutId3 = setTimeout(function(){

            this._current_explore_action = action_name;
            
//console.log('_show_ExploreMenu '+action_name);            
            
            that.menues['explore'].find('.explore-widgets').hide(); //hide others
            if(action_name!='svsAdd'){
                //attempt for non modal 
//console.log('close in _show_ExploreMenu');                
                that.closeSavedSearch();
            }
        
            if(action_name=='search_entity'){

                if(!cont.search_entity('instance'))
                    cont.search_entity({use_combined_select:true, 
                        mouseover: function(){that._resetCloseTimers()}, //NOT USED
                        onClose: function() { 
                                //start search on close
                                that._closeSectionMenu('explore'); 
                                that.switchContainer('explore'); 
                        }
                    });    

                that.menues['explore'].css({bottom:'4px',width:'200px','overflow-y':'auto','overflow-x':'hidden'});

            }
            else if(action_name=='search_quick'){

                if(!cont.search_quick('instance'))
                    //initialization
                    cont.search_quick({
                        onClose: function() { that._closeSectionMenu('explore'); that.switchContainer('explore'); },
                        menu_locked: function(is_locked){ 
                            that._resetCloseTimers();
                            that._explorer_menu_locked = is_locked; 
                    }  });    

                explore_top = menu_item.position().top;
                explore_height = 268+36;
                explore_left = that._widthMenu+1; //201;
                if(explore_top+explore_height>that.element.innerHeight()){
                    explore_top = that.element.innerHeight() - explore_height;
                }


                that.menues['explore'].css({width:'400px',overflow:'hidden'});


            }
            else if(action_name=='search_advanced'){
                
                if(!cont.search_advanced('instance'))
                    //initialization
                    cont.search_advanced({
                        onClose: function() { that._closeSectionMenu('explore'); that.switchContainer('explore'); },
                        menu_locked: function(is_locked){ 
                            that._resetCloseTimers();
                            that._explorer_menu_locked = is_locked; 
                    }  });    

                that.menues['explore'].css({width:'606px', overflow:'hidden'});
            }
            else if(action_name=='svsAdd'){
                that._closeSectionMenu('explore');
                that.addSavedSearch( false );
                return;
            }
            else if(action_name=='svs_list'){
                
                //show in menu section
                that.menues['explore'].css({bottom:'4px',width:'300px',overflow:'auto'});
                //cont.width(300);
                that.svs_list.detach().appendTo(cont);
                that.svs_list.css({'top':0, 'font-size':'1em'}).show();
                that.svs_list.svs_list('option','container_width',300);
                that.svs_list.svs_list('option','hide_header', false);
                that._off(that.svs_list,'mouseenter');

                /*    
                if(that.is_svslist_inline) return;
                //set size of menu section
                that.menues['explore'].css({bottom:'4px',width:'300px',overflow:'auto'});
                var group_ID = (e)?[menu_item.attr('data-id')]:null;
                that.svs_list = that._init_SvsList(cont, group_ID);
                */
            }
            else if(action_name=='recordAdd'){

                
                explore_left = 302;
                
                that.menues['explore']
                    .css({bottom:'4px',width:'300px',overflow:'hidden'})
                    .removeClass('ui-heurist-explore').addClass('ui-heurist-import record-addition');

                if(!cont.recordAdd('instance')){
                    cont.recordAdd({
                        is_h6style: true,
                        onClose: function() { that._closeSectionMenu('explore');},
                        isExpanded: expandRecordAddSetting,
                        onClose: function(){
                            that.coverAll.hide();
                        },
                        mouseover: function() { that._resetCloseTimers()},
                        menu_locked: function(is_locked){ 
                            that._resetCloseTimers();
                            that._explorer_menu_locked = is_locked; 
                    }  });  
                }else{
                    cont.recordAdd('doExpand', expandRecordAddSetting);                        
                }

            }//endif
            
            that.menues['explore'].css({left:explore_left, top:explore_top, height:explore_height});
            
            //show menu section
            that.menues['explore'].css({'z-index':103}).show(); 
            
            cont.show('fade',{},delay>=500?500:10); //show current widget in menu section
            
            if(action_name!='recordAdd' && explore_left>that._widthMenu+1){ //201
                that.menues_explore_gap.css({top:explore_top, height:that.menues['explore'].height()}).show();
            }else{
                that.menues_explore_gap.hide();
            }
        }, delay);
        
    },    
    
    //
    //
    //
    _init_SvsList: function(cont, group_ID){
        
                if(!cont.svs_list('instance')){
                    var that = this;
                    
                    cont.svs_list({
                        is_h6style: true,
                        hide_header: that.is_svslist_inline,
                        container_width: 170,
                        onClose: function(noptions) { 
                            that._closeSectionMenu('explore'); 
                            that.switchContainer('explore'); 

                            if(noptions==null){
                                //close faceted search
                                that._onCloseSearchFaceted();
                            }else{
                                noptions.onclose = function(){ that._onCloseSearchFaceted(); };
                                noptions.is_h6style = true;
                                noptions.maximize = true;

                                //open faceted search
                                that.search_faceted.show();
                                that.containers['explore'].css({left:'332px'}); //move to the right
                                that.containers['explore'].layout().resizeAll();  //update layout

                                if(that.search_faceted.search_faceted('instance')){ 
                                    that.search_faceted.search_faceted('option', noptions ); //assign new parameters
                                }else{
                                    //not created yet
                                    that.search_faceted.search_faceted( noptions );
                                }

                            } 
                        },
                        //show all groups! allowed_UGrpID:group_ID,
                        menu_locked: function(is_locked){ 
                            that._resetCloseTimers();
                            that._explorer_menu_locked = is_locked; 
                        }                            
                        //mouseover: function() { that._resetCloseTimers()},
                    });
                    
                    this._on(cont,{mouseenter: this._resetCloseTimers}); 
                    
                }else{
                    //cont.svs_list('option', 'allowed_UGrpID', group_ID);                        
                }
                
                return cont;        
    },
    
    
    //
    //
    //
    _onCloseSearchFaceted: function(){
        if(this.search_faceted && this.search_faceted.is(':visible')){
            $(this.document).trigger(window.hWin.HAPI4.Event.ON_REC_SEARCHSTART, [ 
                {reset:true, search_realm:this.options.search_realm} ]);  //global app event to clear views
            this.search_faceted.hide();
            this.containers['explore'].css({left:'96px'});
            this.containers['explore'].layout().resizeAll();
        }
    },
    
    //
    //
    //
    _closeSectionMenu: function( section ){
        
        this.menues[section].css({'z-index':0}).hide(); 
        this.menues_explore_gap.hide();
        //this.menues[section].css({'z-index':2,left:'200px'}).show(); 
        if(section=='explore'){
            //attempt for non modal 
            this.divMainMenu.find('li.menu-explore > .menu-text').css('text-decoration', 'none');
            this._current_explore_action = null;
            this.closeSavedSearch();
        }
    },
    
    //
    //
    //
    _getSectionName: function(e){
        var that = this;
        var section_name = null;
        if(e){
            var ele;
            if($(e.target).hasClass('ui-heurist-header') || $(e.target).hasClass('ui-heurist-header2')){
                ele = $(e.target);
            }else{
                ele = $(e.target).parents('.ui-heurist-header2');
                if(ele.length==0){
                    ele = $(e.target).parents('.ui-heurist-header');
                }
            }
            if(ele.length>0){
            $.each(this.sections, function(i, section){
                if(ele.hasClass('ui-heurist-'+section)){
                    section_name = section;
                    return false; //exit loop
                }
            });
            }
        }
        
        return section_name;
    },
    
    
    //
    // opens section menu permanently and switches container 
    //
    _openSectionMenu: function(e){
        
        this._collapseMainMenuPanel(true, 200);
        
        var section = this._getSectionName(e);
        this.switchContainer( section );
    },
    
    //
    // loads content of section from mainMenu6_section.html
    //
    _loadSectionMenu: function( section ){
        
        this.menues[section] = $('<div>')
            .addClass('ui-menu6-section ui-heurist-'+section)
            .css({width:'200px'})   //,'border-left':'4px solid darkgray'})
            .appendTo( this.element );
            
        this.containers[section] = $('<div>')
            .addClass('ui-menu6-container ui-heurist-'+section)
            .appendTo( this.element );
            
            
        this._on(this.menues[section],{
            mouseover: function(e){
                clearTimeout(this._myTimeoutId2); this._myTimeoutId2 = 0; //prevent collapse of section menu
                
                var is_explore = ($(e.target).hasClass('ui-heurist-explore') 
                    || $(e.target).hasClass('record-addition')
                    || $(e.target).parents('.ui-heurist-explore').length>0);
                
                if( is_explore ){
                    clearTimeout(this._myTimeoutId); //prevent collapse of main menu
                    this._myTimeoutId = 0;
                
                    clearTimeout(this._myTimeoutId6); this._myTimeoutId6 = 0; //prevent collapse of Add record
                }
            },
            mouseleave: function(e){
                this._mouseout_SectionMenu(e);   
                var is_explore = ($(e.target).hasClass('ui-heurist-explore') 
                    || $(e.target).parents('.ui-heurist-explore').length>0);
                if( is_explore ){
                    //AAA this._collapseMainMenuPanel(); //force collapse
                }
            }
        });
/*                    
                that._on(that.menues['explore'],{
                    mouseover: function(e){
console.log('prvent colapse');
                        clearTimeout(this._myTimeoutId);
                        this._myTimeoutId = 0;
                    },
                    mouseleave: that._collapseMainMenuPanel //force collapse
                });
*/                
                
                    
                    
        if(section=='explore'){
            
            this.menues_explore_gap = $('<div>')
                    .css({'width':'4px', position:'absolute', opacity: '0.8', 'z-index':103, left:this._widthMenu+'px'}) //200
                    //.addClass('ui-heurist-explore-fade')
                    .hide()
                    .appendTo( this.element );

                    
            this.search_faceted = $('<div>')
                    .addClass('ui-menu6-container ui-heurist-'+section)
                    .css({left:'96px', width:'230px'})
                    .hide()
                    .appendTo( this.element );
            
            this.containers[section]
                .css({left:'96px'})
                .show();

            window.hWin.HAPI4.LayoutMgr.appInitAll('SearchAnalyze3', this.containers[section] );
        }else{
            var that = this;
            this.menues[section].load(
                window.hWin.HAPI4.baseURL+'hclient/widgets/dropdownmenus/mainMenu6_'+section+'.html',
                function(){ 
                    that._initSectionMenu(section);
                });
        }
        
    },
    
    //
    // finds menu actions and assigns icon and title 
    // source of all actions in mainMenu widget 
    // see mainMenuXXX.html snippets for descriptions of actions
    //
    _initSectionMenu: function( section ){
        
        var widget = window.hWin.HAPI4.LayoutMgr.getWidgetByName('mainMenu');
        if(!widget) return;

        $.each(this.menues[section].find('li[data-action]'),
            function(i, item){
                item = $(item);
                var action_id = item.attr('data-action');
                if( action_id ){
                    item.addClass('fancytree-node');
                    var link = widget.mainMenu('menuGetActionLink', action_id);    
                    
                    if(link!=null){
                    
                        $('<span class="ui-icon '+link.attr('data-icon')+'"/>'
                         +'<span class="menu-text truncate" style="max-width: 109px;">'+link.text()+'</span>')
                        .appendTo(item);
                        
                        if(action_id=='menu-import-get-template'){
                            item.css({'font-size':'10px', padding:'0 0 0 20px'})
                        }else{
                            item.css({'font-size':'smaller', padding:'6px'})    
                        }
                        
                        item.attr('title',link.attr('title'));
                        
                    }
                }
            });
            
        $(this.menues[section].children()[1]).find('.ui-icon')
                    .addClass('ui-heurist-title')  //apply color
                    .css({cursor:'pointer'});
                    
        this.menues[section].find('.ui-icon-circle-b-help').css({cursor:'pointer'});
        this._on(this.menues[section].find('.ui-icon-circle-b-help'),
            {click:function(e){
                this.containers[section].empty();
                this.containers[section]
                    .load(window.hWin.HAPI4.baseURL+'context_help/menu_'+section+'.html #content')
                    .css({left:'304px',right: '4px',top:'2px',bottom:'4px',width:'auto',height:'auto'})
                    .show();
            }}
        );
        
        //execute menu on click           
        this._on(this.menues[section].find('li[data-action]'),{click:function(e){
            var li = $(e.target);
            if(!li.is('li')) li = li.parents('li');
            
            this.menues[section].find('li').removeClass('ui-state-active');
            li.addClass('ui-state-active');
            
            
            if(section=='design'){    
                    $(this.containers[section])
                        .css({left:'304px',right: '4px',top:'2px',bottom:'4px',width:'auto',height:'auto'});
            }
            
            //this.switchContainer(section, true);
            widget.mainMenu('menuActionById', li.attr('data-action')); 
            //{container:this.containers[section]}
        }});
        
        if(section=='publish'){
            this._on(this.menues[section].find('li[data-cms-action]'),{click:function(e){
                var li = $(e.target);
                if(!li.is('li')) li = li.parents('li');
                
                this.menues[section].find('li').removeClass('ui-state-active');
                li.addClass('ui-state-active');
                
                this.switchContainer('publish', true);
                
                
                var btn = this.containers['publish'].find('#'
                                                    +li.attr('data-cms-action'));
                if(btn.length>0) btn.click();
                
            }});
        }else  if (section=='import'){ //DEBUG - open record types 
        
                this._updateDefaultAddRectype();
                
                //special behavior for recordAdd
                var ele = this.menues['import'].find('li[data-action="recordAdd"]');
                var that = this;
                this._on(ele,{
                     mouseenter: function(e){
                        clearTimeout(this._myTimeoutId6); this._myTimeoutId6 = 0;
                        this._resetCloseTimers();
                        this._show_ExploreMenu(e);
                     },
                     mouseleave: function(e){
                            clearTimeout(this._myTimeoutId3); this._myTimeoutId3 = 0; //clear timeout on show section menu
                          
                            this._myTimeoutId6 = setTimeout(function(){

                                        that.menues['explore'].hide();
                                        that.menues_explore_gap.hide();
                                        //that._closeSectionMenu('explore');
                                    },  this._delayOnCollapse_SectionMenu); //this._delayOnCollapse_SectionMenu); //600
                     }
                });         
                
                
        
        }else  if (section=='design'){ //DEBUG - open record types 
        
        
            /* DEBUG    
                this._active_section = 'explore';
                this.switchContainer('design', true);
                this.menues['design'].find('li[data-action="menu-structure-rectypes"]').click();
            */
        }
        
        /*
        if(section=='publish'){
            var that = this;
            var menu_container = this.menues[section].find('.heurist-export-menu6');
            $.getScript( window.hWin.HAPI4.baseURL+'hclient/framecontent/exportMenu.js',
            function() {
                var exportMenu = new hexportMenu( menu_container );    
                exportMenu.setDialogOptions({
                        is_h6style: true,
                        isdialog: false, 
                        need_reload: true,
                        onInitFinished: function(){
                            that.switchContainer('publish');
                        },
                        onClose: function() { that.containers['publish'].hide() },
                        container: that.containers['publish']});
            });            
        }*/
        
    },
    
    //
    // switch section on section menu click
    //
    switchContainer: function( section, force_show ){

        var that = this;
        if(that._active_section!=section ){

            that._onCloseSearchFaceted();
            
            if(that._active_section && that.menues[that._active_section])
            {
                that.containers[that._active_section].hide();
                that.menues[that._active_section].hide();
                that.element.removeClass('ui-heurist-'+that._active_section+'-fade');
                that.menues_explore_gap.removeClass('ui-heurist-'+that._active_section+'-fade');
            }
            that._current_explore_action = null;
            that._active_section = section;

            //show menu and section 
            if(section != 'explore') {
                that.menues[section].css('z-index',101).show();
            }
            
                                //section!='publish' && 
            if(force_show || (that.containers[section] && !that.containers[section].is(':empty'))){
                that.containers[section].show();    
            }
            
            //change main background
            this.element.addClass('ui-heurist-'+section+'-fade');    
            this.menues_explore_gap.addClass('ui-heurist-'+section+'-fade');
            
        }else if(force_show){
            that.containers[section].show();    
        }else{
            return;
        }
        
        if(section == 'explore') {
            if(that.containers[section].hasClass('ui-layout-container'))
                 that.containers[section].layout().resizeAll();
        }

    },

    //-----------------------------------------------------------------
    //
    // SAVED FILTERS
    //
    _createListOfGroups: function(){
        
        var bm_on = (window.hWin.HAPI4.get_prefs('bookmarks_on')=='1');
        
        
        var s = '<li class="menu-explore" data-id="bookmark" style="display:'+(bm_on?'block':'none')+'">'  //data-action="svs_list" 
            +'<span class="ui-icon ui-icon-user"/><span class="menu-text">'+window.hWin.HR('My Bookmarks')
            +'</span></li>'
            +'<li class="menu-explore" data-id="all">'  //data-action="svs_list" 
            +'<span class="ui-icon ui-icon-user"/><span class="menu-text">'+window.hWin.HR('My Searches')
            +'</span></li>'            
        
        var groups = window.hWin.HAPI4.currentUser.ugr_Groups;
        for (var groupID in groups)
        {
            if(groupID>0){
                var name = window.hWin.HAPI4.sysinfo.db_usergroups[groupID];
                var sicon = 'users';
                var struncate =  ' truncate" style="max-width: 109px;';
                if(groupID==1){
                    sicon = 'database';
                    struncate = '';
                }else if(groupID==5){
                    sicon = 'globe';
                }
                
                s = s + '<li class="menu-explore" data-id="'+groupID+'">' // data-action="svs_list" 
                    +'<span class="ui-icon ui-icon-'+sicon+'"/><span class="menu-text'+struncate+'">'
                    +name
                    +'</span></li>';
            }
        }
        
        var cont = this.divMainMenu.find('#filter_by_groups');
        cont.children().remove(); //.not(':first')
        $(s).appendTo(cont);

        /*        
        window.hWin.HEURIST4.filters.getFiltersTree( function(data){
            window.hWin.HAPI4.currentUser.ugr_SvsTreeData = data; 
        });
        */
        
    },

    //
    //
    //
    closeSavedSearch: function(){
        if(this.edit_svs_dialog)
            this.edit_svs_dialog.closeEditDialog();
    },
        
    //
    // define new saved filter/search
    //
    addSavedSearch: function( is_modal ){

        if(this.edit_svs_dialog==null){
            this.edit_svs_dialog = new hSvsEdit();    
        }
        
        is_modal = (is_modal!==false);
        
        var that = this;

        var $dlg = this.edit_svs_dialog.showSavedFilterEditDialog( 'saved', null, null, this.currentSearch , false, 
            { my: 'left top', at: 'left+'+(this._widthMenu+4)+'px top', of:this.divMainMenu},
            function(){
                window.hWin.HAPI4.currentUser.usr_SavedSearch = null;
                window.hWin.HAPI4.currentUser.ugr_SvsTreeData = null;
                that.svs_list.svs_list('option','hide_header',true);//to trigger refresh
            }, is_modal, true,                                                                                                         
            function(is_locked, is_mouseleave){  //menu_locked
                if(is_mouseleave){
                    that._collapseMainMenuPanel()
                }else{
                    that._resetCloseTimers();    
                    that._explorer_menu_locked = is_locked; 
                }
            },
            that.reset_svs_edit
        );
        
        /*
        setTimeout(function(){
            $dlg.parent('.ui-dialog').css({top:that.divMainMenu.offset().top, left:(that._widthMenu+4)});    
        },300);
        */
        
        that.reset_svs_edit = false;
    },
    
    //
    //
    //
    initHelpDiv: function(){
        
        this.helper_div = $('<div>').addClass('ui-helper-popup').hide().appendTo(this.element);
        
        var _innerTitle = $('<div>').addClass('ui-heurist-header').appendTo(this.helper_div);  
                                
        $('<span>').appendTo(_innerTitle);
        var btn = $('<button>')
                    .button({icon:'ui-icon-closethick',showLabel:false, label:'Close'}) 
                    .css({'position':'absolute', 'right':'4px', 'top':'6px', height:24, width:24})
                    .appendTo(_innerTitle);
                    
                    
        this._on( btn, {click : function(){
                    this.helper_div.hide();
        }});
                                
        $('<div>').css({top:38}).addClass('ent_wrapper').appendTo(this.helper_div);  
        //this.containers[this._active_section]
    }
    
    
});
