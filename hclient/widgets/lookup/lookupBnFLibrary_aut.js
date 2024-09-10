/**
* lookupBnFLibrary_aut.js - Searching the BnF Library's authoritative records (Under Development)
* 
* This file:
*   1) Loads the content of the corresponding html file (lookupBnFLibrary_aut.html), and
*   2) Performs an api call to the BnF Library's Search API using the User's input, displaying the results within a Heurist result list
* 
* After record selection, the user:
*   Is required to select or create a record for each record pointer field, with a value
*   Is required to enter or correct any terms for each enumerated field, with a value 
*
* @package     Heurist academic knowledge management system
* @link        https://HeuristNetwork.org
* @copyright   (C) 2005-2023 University of Sydney
* @author      Brandon McKay   <blmckay13@gmail.com>
* @license     https://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @version     6.0
*/

/*  
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except in compliance
* with the License. You may obtain a copy of the License at https://www.gnu.org/licenses/gpl-3.0.txt
* Unless required by applicable law or agreed to in writing, software distributed under the License is
* distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
* See the License for the specific language governing permissions and limitations under the License.
*/

$.widget( "heurist.lookupBnFLibrary_aut", $.heurist.lookupBase, {

    // default options
    options: {
    
        height: 750,
        width:  530,
        
        title:  "Search the Bibliothèque nationale de France's authoritative records",
        
        htmlContent: 'lookupBnFLibrary_aut.html'
    },

    _forceClose: false, // skip saving additional mapping and close dialog

    //  
    // invoked from _init after loading of html content
    //
    _initControls: function(){

        // Extra field styling
        this.element.find('.header.recommended').css({width: '100px', 'min-width': '100px', display: 'inline-block'}).addClass('truncate');
        this.element.find('.bnf_form_field').css({display:'inline-block', 'margin-top': '2.5px'});

        // Action button styling
        this.element.find('#btnStartSearch').addClass("ui-button-action");

        // Handling for 'Search' button        
        this._on(this.element.find('#btnStartSearch').button(),{
            click: this._doSearch
        });

        let $select = this.element.find('#rty_flds');
        let top_opt = [{key: '', title: 'select a field...', disabled: true, selected: true, hidden: true}];
        let sel_options = {
            useHtmlSelect: false
        };
        window.hWin.HEURIST4.ui.createRectypeDetailSelect($select[0], this.options.mapping.rty_ID, ['blocktext'], top_opt, sel_options);

        this._on(this.element.find('input[name="dump_field"]'), {
            change: function(){
                let opt = this.element.find('input[name="dump_field"]:checked').val();
                window.hWin.HEURIST4.util.setDisabled(this.element.find('#rty_flds'), opt == 'rec_ScratchPad');
            }
        });

        this._on(this.element.find('#save-settings').button(), {
            click: this._saveExtraSettings
        });

        // Setup settings tab
        this._setupSettings();

        this.element.find('#inpt_any').focus();

        return this._super();
    },
    
    /**
     * Set up additional settings tab
     */
    _setupSettings: function(){

        let options = this.options.mapping?.options;
        let need_save = false;

        if(!options || window.hWin.HEURIST4.util.isempty(options)){
            options = {
                dump_record: true,
                dump_field: 'rec_ScratchPad'
            };

            need_save = true;
        }

        if(!window.hWin.HEURIST4.util.isempty(options['dump_record'])){
            this.element.find('input[name="dump_record"]').prop('checked', options['dump_field']);
        }

        if(!window.hWin.HEURIST4.util.isempty(options['dump_field'])){
            const selected = options['dump_field'];

            if(selected === 'rec_ScratchPad'){
                this.element.find('input[name="dump_field"][value="rec_ScratchPad"]').prop('checked', true);
            }else{
                this.element.find('input[name="dump_field"][value="dty_ID"]').prop('checked', true);
                this.element.find('#rty_flds').val(selected);

                if(this.element.find('#rty_flds').hSelect('instance') !== undefined){
                    this.element.find('#rty_flds').hSelect('refresh');
                }
            }

            window.hWin.HEURIST4.util.setDisabled(this.element.find('#rty_flds'), selected == 'rec_ScratchPad');
        }

        if(need_save){
            this._saveExtraSettings();
        }
    },

    /**
     * Get record dump settings
     */
    _getRecDumpSetting: function(){

        const get_recdump = this.element.find('input[name="dump_record"]').is(':checked');
        let recdump_fld = '';
        
        if(get_recdump){

            recdump_fld = this.element.find('input[name="dump_field"]:checked').val();
            if(recdump_fld === 'dty_ID'){
                recdump_fld = this.element.find('#rty_flds').val();
            }
        }

        return [ get_recdump, recdump_fld ];
    },

    /**
     * Save extra settings
     * @param {boolean} close_dlg - whether to close the dialog after saving 
     */
    _saveExtraSettings: function(close_dlg = false){

        let that = this;
        let services = window.hWin.HEURIST4.util.isJSON(window.hWin.HAPI4.sysinfo['service_config']);
        const rec_dump_settings = this._getRecDumpSetting();

        if(services !== false){
            services[this.options.mapping.service_id]['options'] = { 
                'dump_record': rec_dump_settings[0],
                'dump_field': rec_dump_settings[1]
            };

            let fields = {
                'sys_ID': 1,
                'sys_ExternalReferenceLookups': JSON.stringify(services)
            };
    
            // Update sysIdentification record
            let request = {
                'a': 'save',
                'entity': 'sysIdentification',
                'request_id': window.hWin.HEURIST4.util.random(),
                'isfull': 0,
                'fields': fields
            };

            window.hWin.HAPI4.EntityMgr.doRequest(request, function(response){
    
                if(response.status == window.hWin.ResponseStatus.OK){
                    window.hWin.HAPI4.sysinfo['service_config'] = window.hWin.HEURIST4.util.cloneJSON(services); // update global copy
                    if(close_dlg === true){
                        that._as_dialog.dialog('close');
                    }else{
                        that.options.mapping = window.hWin.HEURIST4.util.cloneJSON(services[that.options.mapping.service_id]);
                        window.hWin.HEURIST4.msg.showMsgFlash('Extra lookup settings saved...', 3000);
                    }
                }else{
                    window.hWin.HEURIST4.msg.showMsgErr(response);
                }
            });
        }
    },

    /**
     * Result list rendering function called for each record
     * 
     * Param:
     *  recordset (HRecordSet) => Heurist Record Set
     *  record (json) => Current Record being rendered
     * 
     * Return: html
     */
    _rendererResultList: function(recordset, record){

        /**
         * Get field details for displaying
         * 
         * Param:
         *  fldname (string) => mapping field name
         *  width (int) => width for field
         * 
         * Return: html
         */
        function fld(fldname, width){

            let s = recordset.fld(record, fldname);
            let authority_type = recordset.fld(record, 'authority_type');

            s = window.hWin.HEURIST4.util.htmlEscape(s ? s : '');

            let title = s;

            if(fldname == 'auturl'){
                s = `<a href="${s}" target="_blank"> view here </a>`;
                title = 'View authoritative record';
            }
            
            if(authority_type == '215' || authority_type == '216' || authority_type == '240' || authority_type == '250'){ // name only
                width = (fldname == 'name') ? 75 : 0;
            }else if(authority_type == '200'){
                width = (fldname == 'location') ? 0 : (fldname == 'name' ? 50 : width);
            }else if(authority_type == '210'){
                width = (fldname == 'years_active') ? 0 : (fldname == 'name' ? 40 : (fldname == 'location' ? 20 : width));
            }

            if(s != ''){
                if(fldname == 'years_active' || fldname == 'location'){
                    s = `( ${s} )`;
                }else if(fldname == 'role'){
                    s = `[ ${s} ]`;
                }
            }

            if(width>0){
                s = `<div style="display:inline-block;width:${width}ex" class="truncate" title="${title}">${s}</div>`;
            }

            return s;
        }

        const recTitle = fld('name', 35) + fld('location', 15) + fld('years_active', 10) + fld('role', 15) + fld('auturl', 10);
        recordset.setFld(record, 'rec_Title', recTitle);

        return this._super(recordset, record);
    },

    /**
     * Return record field values in the form of a json array mapped as [dty_ID: value, ...]
     * For multi-values, [dty_ID: [value1, value2, ...], ...]
     * 
     * Param: None
     */
    doAction: function(){

        window.hWin.HEURIST4.msg.bringCoverallToFront(this.element);

        // get selected recordset
        let recset = this.recordList.resultList('getSelected', false);

        if(!recset || recset.length() != 1){
            return;
        }

        let res = {};
        let rec = recset.getFirstRecord(); // get selected record

        let map_flds = Object.keys(this.options.mapping.fields); // mapped fields names, to access fields of rec

        res['BnF_ID'] = recset.fld(rec, 'BnF_ID'); // add BnF ID
        res['ext_url'] = recset.fld(rec, 'auturl'); // add BnF URL

        // Assign individual field values, here you would perform any additional processing for selected values (example. get ids for vocabulrary/terms and record pointers)
        for(const fld_Name of map_flds){

            let dty_ID = this.options.mapping.fields[fld_Name];
            let val = recset.fld(rec, fld_Name);
            let field_type = $Db.dty(dty_ID, 'dty_Type');

            if(val != null){

                let val_isArray = Array.isArray(val);
                let val_isObject = window.hWin.HEURIST4.util.isObject(val);

                // Match term labels with val, need to return the term's id to properly save its value
                if(field_type == 'enum'){

                    if(val_isObject){ 
                        val = Object.values(val);
                    }else if(!val_isArray){
                        val = [val];
                    }

                    let vocab_ID = $Db.dty(dty_ID, 'dty_JsonTermIDTree');

                    for(const idx in val){

                        if(!Number.isInteger(+val[idx])){
                            continue;
                        }

                        let existing_term = $Db.getTermByCode(vocab_ID, +val[idx]);
                        if(existing_term !== null){
                            val[idx] = existing_term;
                        }
                    }
                }else if(field_type == 'resource'){ // prepare search string for user to select/create a record

                    let search_val = '';

                    if(val_isObject){

                        for(let key in val){

                            if(search_val != ''){
                                search_val += ', ';
                            }
                            search_val += val[key];
                        }
                    }else if(val_isArray){
                        search_val = val.join(', ');
                    }else{
                        search_val = val;
                    }

                    val = search_val;
                }
            }

            // Check that val and id are valid, add to response object
            if(dty_ID>0 && val){

                if(!res[dty_ID]){
                    res[dty_ID] = [];
                }

                if(window.hWin.HEURIST4.util.isObject(val)){

                    let complete_val = '';
                    for(let key in val){

                        if(complete_val != ''){
                            complete_val += ', ';
                        }
                        complete_val += val[key];
                    }
                }else if(field_type != 'resource' && Array.isArray(val)){
                    res[dty_ID].push(val.join(', '));
                }else{
                    res[dty_ID].push(val);    
                }
            }
        }

        this.closingAction(res);
    },

    /**
     * Create search URL using user input within form
     * Perform server call and handle response
     * 
     * Params: None
     */
    _doSearch: function(){

        let that = this;

        /**
         * recordSchema: XML structure for record details (changing this will require changes to the php code in record_lookup.php)
         * maximumRecords: maximum number of records returned from the search (api default: 100)
         * startRecord: starting point, complete searches in batches (api default: 1)
         * query: encoded string enclosed in brackets (at minimum, the spaces MUST be encoded)
         */

        let maxRecords = $('#rec_limit').val(); // limit number of returned records
        maxRecords = (!maxRecords || maxRecords <= 0) ? 20 : maxRecords;

        let sURL = `https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&recordSchema=unimarcxchange&maximumRecords=${maxRecords}&startRecord=1`; // base URL

        let accesspointHasValue = this.element.find('#inpt_accesspoint').val() != '';
        let typeHasValue = this.element.find('#inpt_type').val() != '';
        let isniHasValue = this.element.find('#inpt_isni').val() != '';
        let isnidateHasValue = this.element.find('#inpt_isnidate').val() != '';
        let domainHasValue = this.element.find('#inpt_domain').val() != '';
        let recidHasValue = this.element.find('#inpt_recordid').val() != '';

        // Check that something has been entered
        if(this.element.find('#inpt_any').val()=='' && !accesspointHasValue && !typeHasValue && !isniHasValue && !isnidateHasValue && !domainHasValue && !recidHasValue){

            window.hWin.HEURIST4.msg.showMsgFlash('Please enter a value in any of the search fields...', 1000);
            return;
        }
        
        // Construct query portion of url
        let query = '(';

        /** 
         * Additional search fields can be found here [catalogue.bnf.fr/api/test.do], note: ONLY the authoritative fields can be added here (fields starting with 'aut.')
         * if you wish to query bibliographic records (fields starting with 'bib.'), we suggest the alternative BnF lookup available (lookupBnFLibrary_bib)
         * 
         * each field name and search value are separated by a relationship, common ones are: [all, any, adj]
         * 
         * also separating each field query is a boolean logic [and, or, not]
         */

        // any field
        if(this.element.find('#inpt_any').val()!=''){
            query += `aut.anywhere ${this.element.find('#inpt_any_link').val()} "${this.element.find('#inpt_any').val()}"`;

            if(accesspointHasValue || typeHasValue || isniHasValue || isnidateHasValue || domainHasValue || recidHasValue){ // add combination logic
                query += ` ${this.element.find('#inpt_any_logic').val()} `;
            }
        }

        // access point field
        if(accesspointHasValue){

            query += `aut.accesspoint ${this.element.find('#inpt_accesspoint_link').val()} "${this.element.find('#inpt_accesspoint').val()}"`;

            if(typeHasValue || isniHasValue || isnidateHasValue || domainHasValue || recidHasValue){ // add combination logic
                query += ` ${this.element.find('#inpt_accesspoint_logic').val()} `;
            }
        }

        // type field
        if(typeHasValue){

            query += `aut.type ${this.element.find('#inpt_type_link').val()} "${this.element.find('#inpt_type').val()}"`;

            if(isniHasValue || isnidateHasValue || domainHasValue || recidHasValue){ // add combination logic
                query += ` ${this.element.find('#inpt_type_logic').val()} `;
            }
        }

        // isni field
        if(isniHasValue){

            query += `aut.isni ${this.element.find('#inpt_isni_link').val()} "${this.element.find('#inpt_isni').val()}"`;

            if(isnidateHasValue || domainHasValue || recidHasValue){ // add combination logic
                query += ` ${this.element.find('#inpt_isni_logic').val()} `;
            }
        }

        // isni date field
        if(isnidateHasValue){

            query += `aut.isnidate ${this.element.find('#inpt_isnidate_link').val()} "${this.element.find('#inpt_isnidate').val()}"`;

            if(domainHasValue || recidHasValue){ // add combination logic
                query += ` ${this.element.find('#inpt_isnidate_logic').val()} `;
            }
        }

        // domain field
        if(domainHasValue){

            query += `aut.domain ${this.element.find('#inpt_domain_link').val()} "${this.element.find('#inpt_domain').val()}"`;

            if(recidHasValue){ // add combination logic
                query += ` ${this.element.find('#inpt_domain_logic').val()} `;
            }
        }

        // record id field
        if(recidHasValue){
            query += `aut.recordid ${this.element.find('#inpt_recordid_link').val()} "${this.element.find('#inpt_recordid').val()}"`;
            // no combination logic as record id is the last field
        }

        // Close off and encode query portion, then add to request url
        if(query.length != 1){

            query += ')';
            query = encodeURIComponent(query);

            sURL += `&query=${query}`;
        }

        window.hWin.HEURIST4.msg.bringCoverallToFront(this.element);

        // for record_lookup.php
        let request = {
            service: sURL, // request url
            serviceType: 'bnflibrary_aut' // requesting service, otherwise no
        };

        // calls /heurist/hserv/controller/record_lookup.php
        window.hWin.HAPI4.RecordMgr.lookup_external_service(request, function(response){

            window.hWin.HEURIST4.msg.sendCoverallToBack();

            if(window.hWin.HEURIST4.util.isJSON(response)){

                if(response.result != null){ // Search result
                    that._onSearchResult(response);
                }else if(response.status && response.status != window.hWin.ResponseStatus.OK){ // Error return
                    window.hWin.HEURIST4.msg.showMsgErr(response);
                }else{ // No results

                    window.hWin.HEURIST4.msg.showMsgFlash('No results returned', 3000);

                    that.recordList.show();
                    that.recordList.resultList('updateResultSet', null);
                }
            }
        });
    },

    /**
     * Prepare json for displaying via the Heuirst resultList widget
     *
     * @param {json} json_data - search response
     */
    _onSearchResult: function(json_data){

        let maxRecords = $('#rec_limit').val(); // limit number of returned records
        maxRecords = (!maxRecords || maxRecords <= 0) ? 20 : maxRecords;

        json_data = window.hWin.HEURIST4.util.isJSON(json_data);

        if(!json_data){
            this._super(false);
        }

        if(!json_data.result) return false;

        let res_records = {}, res_orders = [];

        // Prepare fields for mapping
        // the fields used here are defined within /heurist/hserv/controller/record_lookup_config.json where "service" = bnfLibrary
        let fields = ['rec_ID', 'rec_RecTypeID']; // added for record set
        let map_flds = Object.keys(this.options.mapping.fields);
        fields = fields.concat(map_flds);            
        fields = fields.concat('BnF_ID');

        // Parse json to Record Set
        let i = 1;
        for(const record of json_data.result){

            let recID = i++;
            let values = [recID, this.options.mapping.rty_ID];

            // Add current record details, field by field
            for(const fld_Name of map_flds){
                values.push(record[fld_Name]);
            }

            values.push(record['BnF_ID']);

            res_orders.push(recID);
            res_records[recID] = values;
        }

        if(json_data.numberOfRecords > maxRecords){
            window.hWin.HEURIST4.msg.showMsgDlg(
                `There are ${json_data.numberOfRecords} records satisfying these criteria, only the first ${maxRecords} are shown.<br>Please narrow your search.`
            );
        }

        let res = res_orders.length > 0 ? {fields: fields, order: res_orders, records: res_records} : false;
        this._super(res);
    }
});