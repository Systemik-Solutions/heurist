/**
* editDetailType.js
* A form to edit field type, or create a new field type. It is utilized as pop-up from manageDetailTypes and manageRectypes
* it may call another pop-ups: selectTerms and selectRectype
*
* 28/04/2011
* @author: Juan Adriaanse
* @author: Artem Osmakov
* @author: Stephen White
*
* @copyright (C) 2005-2011 University of Sydney Digital Innovation Unit.
* @link: http://HeuristScholar.org
* @license http://www.gnu.org/licenses/gpl-3.0.txt
* @package Heurist academic knowledge management system
* @todo
**/

/**  NOT USED
* Validates value inserted into input field. In this case, make sure it's an integer
* used to Hul.validate order in group value (now hidden)
* @param evt - the evt object for this keypress
*/
function checkIfInteger(evt) {
	if((evt.keyCode) !== 9) {
		var theEvent = evt || window.event;
		var key = theEvent.keyCode || theEvent.which;
		key = String.fromCharCode(key);
		var regex = /[0-9]|\./;
		if( !regex.test(key) ) {
			theEvent.returnValue = false;
			theEvent.preventDefault();
		}
	}
}



//aliases
var Dom = YAHOO.util.Dom,
	Hul = top.HEURIST.util;


var detailTypeEditor;
/**
* DetailTypeEditor - class for pop-up edit field type window
*
* public methods
*
* save - sends data to server and closes the pop-up window in case of success
* cancel - checks if changes were made, shows warning and closes the window
*
* @author Artem Osmakov <osmakov@gmail.com>
* @version 2011.0427
*/

function DetailTypeEditor() {

		var _className = "DetailTypeEditor",
			_detailType, //field type to edit
			_dtyID,     // its ID
			_updatedFields = [], //field names which values were changed to be sent to server
			_updatedDetails = [], //field values
			_keepStatus,// Keeps current status for rollback if user decided to keep it
			_keepType;	// Keeps current datatype for rollback


	/**
	* Initialization of input form
	*
	* Reads GET parameters, creates group selector and invokes the method that fills values for inputs
	*/
	function _init() {

		var dtgID;

		// reads parameters from GET request
		if (location.search.length > 1) {
				top.HEURIST.parameters = top.HEURIST.parseParams(location.search);
				_dtyID = top.HEURIST.parameters.detailTypeID;
				dtgID = top.HEURIST.parameters.groupID;

				if(_dtyID){
					var dt = top.HEURIST.detailTypes.typedefs[_dtyID];
					if(!Hul.isnull(dt)){
						_detailType = dt.commonFields;
					}
				}
				if(Hul.isnull(dtgID)){
					dtgID = 0;
				}
		}

		if (_dtyID && Hul.isnull(_detailType) ){
			Dom.get("msg").style.visibility = "visible";
			Dom.get("statusMsg").innerHTML = "Error: field type #"+_dtyID+"  not be found. Clicking 'save' button will create a new Field Type.";
		}

		var fi = top.HEURIST.detailTypes.typedefs.fieldNamesToIndex;

		//creates new empty field type in case ID is not defined
		if(Hul.isnull(_detailType)){
			_dtyID =  -1;

			_detailType = new Array();

			_detailType[fi.dty_Name] = '';
			_detailType[fi.dty_ExtendedDescription] = '';
			_detailType[fi.dty_Type] = '';
			_detailType[fi.dty_OrderInGroup] = 0;
			_detailType[fi.dty_HelpText] = '';
			_detailType[fi.dty_ShowInLists] = 1;
			_detailType[fi.dty_Status] = 'open';
			_detailType[fi.dty_DetailTypeGroupID] = dtgID;
			_detailType[fi.dty_FieldSetRectypeID] = null;
			_detailType[fi.dty_JsonTermIDTree] = null;
			_detailType[fi.dty_TermIDTreeNonSelectableIDs] = null;
			_detailType[fi.dty_PtrTargetRectypeIDs] = null;

			Dom.get("dty_Type").disabled = false;
		}else{
			Dom.get("dty_Type").disabled = true;
		}

		_keepStatus = _detailType[fi.dty_Status]; // Keeps current status for rollback
		Dom.get("dty_Status").innerHTML = _keepStatus;
		_keepType = _detailType[fi.dty_Type]; // Keeps current datatype

		// creates and fills group selector
		_initGroupComboBox();

		//fills input with values from _detailType array
		_fromArrayToUI();
	}

	/**
	* Toggle fields to disable. Is called when status is set to 'Reserved'.
	* If changed = true, it means that the status is manually changed to reserved,
	* so untill it is saved, it can be changed back. If it was reserved when starting the editRectype,
	* keep it disabled
	*/
	function _toggleAll(disable, changed) {
			Dom.get("dty_Name").disabled = disable;
			Dom.get("dty_DetailTypeGroupID").disabled = disable;
			//Dom.get("dty_Status").disabled = disable;
			Dom.get("dty_OrderInGroup").disabled = disable;
			Dom.get("dty_ShowInLists").disabled = disable;

			Dom.get("termsPreview").disabled = disable;
			Dom.get("btnSelTerms").disabled = disable;
			Dom.get("btnSelRecType1").disabled = disable;
			Dom.get("btnSelRecType2").disabled = disable;
	}

	function _preventSel(event){
		event.target.selectedIndex=0;
	}

	/**
	* recreateTermsPreviewSelector
	* creates and fills selector for Terms Tree if datatype is enum, relmarker, relationtype
	* @param datatype an datatype
	* @allTerms - JSON string with terms
	* @disabledTerms  - JSON string with disabled terms
	*/
	function _recreateTermsPreviewSelector( datatype, allTerms, disabledTerms ) {

				allTerms = Hul.expandJsonStructure(allTerms);
				disabledTerms = Hul.expandJsonStructure(disabledTerms);

				if (typeof disabledTerms.join === "function") {
						disabledTerms = disabledTerms.join(",");
				}

				if(!Hul.isnull(allTerms)) {
					//remove old combobox
					var prev = Dom.get("termsPreview"),
						i;
					for (i = 1; i < prev.children.length; i++) {
						prev.removeChild(prev.childNodes[1]);
					}
					var el_sel;
					// add new select (combobox)
					if(datatype === "enum") {

						el_sel = Hul.createTermSelect(allTerms, disabledTerms, top.HEURIST.terms.termsByDomainLookup['enum'], null);
						el_sel.style.backgroundColor = "#cccccc";
						el_sel.onchange =  _preventSel;
						prev.appendChild(el_sel);

					}
					else if(datatype === "relmarker" || datatype === "relationtype") {
						el_sel = Hul.createTermSelect(allTerms, disabledTerms, top.HEURIST.terms.termsByDomainLookup.relation, null);
						el_sel.style.backgroundColor = "#cccccc";
						el_sel.onchange =  _preventSel;
						prev.appendChild(el_sel);
					}
				}
	}

	/**
	* recreateRecTypesPreview - creates and fills selector for Record(s) pointers if datatype
	* is fieldsetmarker, relmarker, resource
	*
	* @param type an datatype
	* @value - comma separated list of rectype IDs
	*/
	function _recreateRecTypesPreview(type, value) {

		var divRecType = Dom.get( (type==="fieldsetmarker")? "dty_FieldSetRecTypeIDPreview" : "dty_PtrTargetRectypeIDsPreview" );
		var txt = "";
		if(divRecType===null) {
			return;
		}

		if(value) {
				var arr = value.split(","),
				ind, dtName;
				for (ind in arr) {
					dtName = top.HEURIST.rectypes.names[arr[ind]];
					if(!txt) {
						txt = dtName;
					}else{
						txt += ", " + dtName;
					}
				} //for
		}else{
			txt = "unconstrained";
		}
		if (txt.length > 40){
			divRecType.title = txt;
			txt = txt.substr(0,40) + "&#8230";
		}else{
			divRecType.title = "";
		}
		divRecType.innerHTML = txt;
	}

	/**
	* onSelectTerms
	*
	* listener of "Change vocabulary" button
	* Shows a popup window where user can select terms to create a term tree as wanted
	*/
	function _onSelectTerms(){

	var type = Dom.get("dty_Type").value;
	var allTerms = Dom.get("dty_JsonTermIDTree").value;
	var disTerms = Dom.get("dty_TermIDTreeNonSelectableIDs").value;
	var db = (top.HEURIST.parameters.db? top.HEURIST.parameters.db : (top.HEURIST.database.name?top.HEURIST.database.name:''));

	Hul.popupURL(top, top.HEURIST.basePath +
		"admin/structure/selectTerms.html?dtname="+_dtyID+"&datatype="+type+"&all="+allTerms+"&dis="+disTerms+"&db="+db,
		{
		"close-on-blur": false,
		"no-resize": true,
		height: 500,
		width: 750,
		callback: function(editedTermTree, editedDisabledTerms) {
			if(editedTermTree || editedDisabledTerms) {
				//update hidden fields
				Dom.get("dty_JsonTermIDTree").value = editedTermTree;
				Dom.get("dty_TermIDTreeNonSelectableIDs").value = editedDisabledTerms;
					_recreateTermsPreviewSelector(Dom.get("dty_Type").value, editedTermTree, editedDisabledTerms);
			}
		}
	});

	}

	/**
	* onSelectRectype
	*
	* listener of "Select Record Type" buttons
	* Shows a popup window where you can select record types
	*/
	function _onSelectRectype() {
	var type = Dom.get("dty_Type").value;
	var args,URL;
	var db = (top.HEURIST.parameters.db? top.HEURIST.parameters.db : (top.HEURIST.database.name?top.HEURIST.database.name:''));
	if(type === "fieldsetmarker") {
		if(Dom.get("dty_FieldSetRecTypeID")) {
			args = Dom.get("dty_FieldSetRecTypeID").value;
		}
	}
	if(type === "relmarker" || type === "resource") {
		if(Dom.get("dty_PtrTargetRectypeIDs")) {
			args = Dom.get("dty_PtrTargetRectypeIDs").value;
		}
	}
	var db = (top.HEURIST.parameters.db? top.HEURIST.parameters.db :
						(top.HEURIST.database.name?top.HEURIST.database.name:''));
	if(args) {
		URL =  top.HEURIST.basePath + "admin/structure/selectRectype.html?type=" + type + "&ids=" + args+"&db="+db;
	} else {
		URL =  top.HEURIST.basePath + "admin/structure/selectRectype.html?type=" + type+"&db="+db;
	}
	if(type === "relmarker" || type === "resource" || type === "fieldsetmarker") {
		Hul.popupURL(top, URL, {
			"close-on-blur": false,
			"no-resize": true,
			height: 480,
			width: 440,
			callback: function(recordTypesSelected) {
				if(recordTypesSelected !== null) { // TODO: Test this
					if(type === "fieldsetmarker") { // Change comma seperated list to right format
						Dom.get("dty_FieldSetRecTypeID").value = recordTypesSelected;
					} else {
						Dom.get("dty_PtrTargetRectypeIDs").value = recordTypesSelected;
					}

						_recreateRecTypesPreview(type, recordTypesSelected);
				}
			}
		});
	}
	}

	/**
	* Initialization of group selector
	*
	* Gets all groups in HEURIST DB, creates and adds oprions to group selector
	*/
	function _initGroupComboBox() {

		var el = Dom.get("dty_DetailTypeGroupID"),
			dtg_ID,
			index;

		for (index in top.HEURIST.detailTypes.groups){
			if(!isNaN(Number(index))) {
				dtg_ID = top.HEURIST.detailTypes.groups[index].id;
				var grpName = top.HEURIST.detailTypes.groups[index].name;

				var option = document.createElement("option");
				option.text = grpName;
				option.value = dtg_ID;

				try
				{
					// for IE earlier than version 8
					el.add(option, el.options[null]);
				}
				catch (e)
				{
					el.add(option,null);
				}
			}
		} //for
	}

	/**
	*  Fills inputs with values from _detailType array
	*/
	function _fromArrayToUI(){

		var i,
			el,
			fnames = top.HEURIST.detailTypes.typedefs.commonFieldNames,
			fi = top.HEURIST.detailTypes.typedefs.fieldNamesToIndex;

		for (i = 0, l = fnames.length; i < l; i++) {
			var fname = fnames[i];
			el = Dom.get(fname);
			if(!Hul.isnull(el)){
				if ( fname==='dty_ShowInLists' ) { // dty_ShowInLists
					el.checked = (Number(_detailType[fi.dty_ShowInLists])===1);
				}else{
				el.value = _detailType[i];
			}
		}
		}

		//to trigger setting visibilty for div with terms tree and record pointer
		_onChangeType(null);

		// create preview for Terms Tree and record pointer
		_recreateTermsPreviewSelector(
						_detailType[fi.dty_Type],
						_detailType[fi.dty_JsonTermIDTree],
						_detailType[fi.dty_TermIDTreeNonSelectableIDs]);

		_recreateRecTypesPreview(_detailType[fi.dty_Type],
					((_detailType[fi.dty_Type]==="fieldsetmarker")
							?_detailType[fi.dty_FieldSetRectypeID]:_detailType[fi.dty_PtrTargetRectypeIDs]) );

		if (_dtyID<0){
			Dom.get("dty_ID").innerHTML = 'to be generated';
			document.title = "Create New Field Type";
		}else{
			Dom.get("dty_ID").innerHTML =  _dtyID;
			document.title = "Field Type #: " + _dtyID+" '"+_detailType[fi.dty_Name]+"'";

			var aUsage = top.HEURIST.detailTypes.rectypeUsage[_dtyID];
			var iusage = (Hul.isnull(aUsage)) ? 0 : aUsage.length;
			var warningImg = "<img src='" + top.HEURIST.basePath + "common/images/url_warning.png'>";

			if(iusage > 0) {
				if(iusage===1) {
					Dom.get("msg").style.visibility = "visible";
					Dom.get("statusMsg").innerHTML = warningImg + "WARNING: this fieldtype is used in " + iusage + " recordtype. Changes will affect that recordtype.";
				} else {
					Dom.get("msg").style.visibility = "visible";
					Dom.get("statusMsg").innerHTML = warningImg + "WARNING: this fieldtype is used in " + iusage + " recordtypes. Changes will affect every one of those.";
				}
			}
		}
	}


	/**
	* Stores the changed values and verifies mandatory fields
	*
	* Compares data in input with values and in _detailType array, then
	* gathers changed values from UI elements (inputs) into 2 arrays _updatedFields and _updatedDetails
	* this function is invoked in 2 places:
	* 1) in cancel method - to check if something was changed and show warning
	* 2) in save (_updateDetailTypeOnServer) - to gather the data to send to server
	*
	* @param isShowWarn - show alert about empty mandatory fields, it is false for cancel
	* @return "mandatory" in case there are empty mandatory fields (it prevents further saving on server)
	*           or "ok" if all mandatory fields are filled
	*/
	function _fromUItoArray(isShowWarn){

		_updatedFields = [];
		_updatedDetails = [];

		var el = Dom.get("dty_ShowInLists");
		el.value = el.checked?1:0;

		var i;
		var fnames = top.HEURIST.detailTypes.typedefs.commonFieldNames;

		//take only changed values
		for (i = 0, l = fnames.length; i < l; i++){
			var fname = fnames[i];
			el = Dom.get(fname);
			if( !Hul.isnull(el) ){
				if(_dtyID<0 || (el.value!==String(_detailType[i]) && !(el.value==="" && _detailType[i]===null)))
				{
					_updatedFields.push(fname);
					_updatedDetails.push(el.value);
				}
			}
		}

		// check mandatory fields
		if(Dom.get("dty_Name").value==="") {
				if(isShowWarn) {
					alert("Name is mandatory field");
				}
				Dom.get("dty_Name").focus();
				_updatedFields = [];
				return "mandatory";
		}
		if(Dom.get("dty_HelpText").value==="") {
				if(isShowWarn) {
					alert("Help text is mandatory field");
				}
				Dom.get("dty_HelpText").focus();
				_updatedFields = [];
				return "mandatory";
		}

		if(Dom.get("dty_Type").value==="enum"){
			var dd = Dom.get("dty_JsonTermIDTree").value;
			if( dd==="" || dd==="{}" ) {
				if(isShowWarn) {
					alert("For enum type you have to select at least one term. Click button 'Change vocabulary'");
				}
				_updatedFields = [];
				return "mandatory";
			}
		}
		var val = Dom.get("dty_Type").value;
		if(Hul.isempty(val)){
				if(isShowWarn) {
					alert("Data Type is madatory field");
				}
				Dom.get("dty_Type").focus();
				_updatedFields = [];
				return "mandatory";
		}

		return "ok";
	}

	/**
	* Http response listener
	*
	* shows information about result of operation of saving on server and closes this pop-up window in case of success
	*
	* @param context - data from server
	*/
	function _updateResult(context) {
		if(!context) {
			alert("An error occurred trying to contact the database");
		}else{
			var error = false,
				report = "",
				ind;

			for(ind in context.result){
				if( !Hul.isnull(ind) ){
					var item = context.result[ind];
					if(isNaN(item)){
						alert("An error occurred: " + item);
						error = true;
					}else{
						_dtyID = Number(item);
						if(report!=="") {
							report = report + ",";
						}
						report = report + Math.abs(_dtyID);
					}
				}
			}

			if(!error){
				var ss = (_dtyID < 0)?"added":"updated";

				if(report.indexOf(",")>0){
					// this alert is a pain: alert("Field types with IDs :"+report+ " were succesfully "+ss);
				}else{
					// this alert is a pain: alert("Field type with ID " + report + " was succesfully "+ss);
				}
				window.close(context); //send back new HEURIST strcuture
			}
		}
	}

	/**
	* Apply form
	* private method for public method "save"
	* 1. gather changed data from UI (_fromUItoArray) to _updatedFields, _updatedDetails
	* 2. creates object to be sent to server
	* 3. sends data to server
	*/
	function _updateDetailTypeOnServer()
	{

		//1. gather changed data
		if(_fromUItoArray(true)==="mandatory"){ //save all changes
			return;
		}

		var str = null;

		//2. creates object to be sent to server
		if(_dtyID !== null && _updatedFields.length > 0){
			var k,
				val;
			var oDetailType = {detailtype:{
				colNames:{common:[]},
				defs: {}
			}};

			//fill array of updated fieldnames
			//var fieldNames = top.HEURIST.detailTypes.typedefs.commonFieldNames;

			var values = [];
			for(k = 0; k < _updatedFields.length; k++) {
				oDetailType.detailtype.colNames.common.push(_updatedFields[k]);
				values.push(_updatedDetails[k]);
			}

			oDetailType.detailtype.defs[_dtyID] = {};
			oDetailType.detailtype.defs[_dtyID].common = [];
			for(val in values) {
				oDetailType.detailtype.defs[_dtyID].common.push(values[val]);
			}
			str = YAHOO.lang.JSON.stringify(oDetailType);
		}


		if(str !== null) {
//DEBUG alert("Stringified changes: " + str);

			// 3. sends data to server
			var db = (top.HEURIST.parameters.db? top.HEURIST.parameters.db :
								(top.HEURIST.database.name?top.HEURIST.database.name:''));
			var baseurl = top.HEURIST.baseURL + "admin/structure/saveStructure.php";
			var callback = _updateResult;
			var params = "method=saveDT&db="+db+"&data=" + encodeURIComponent(str);
			Hul.getJsonData(baseurl, callback, params);
		} else {
			window.close(null);
		}
	}



	/**
	* onChangeType - listener for datetype selector
	*
	* Sets visibilty for div with terms tree and record pointer
	* Clears hidden fields for term tree and pointer in case of changing type
	* is invoked explicitely in _fromArrayToUI
			 */
	function _onChangeType(e){

		var el = Dom.get("dty_Type"); //e.target;
		var isInitialCall = (e===null);

		Dom.get("pnl_relmarker").style.display = "none";
		Dom.get("pnl_enum").style.display = "none";
		Dom.get("pnl_fieldsetmarker").style.display = "none";

		var changeToNewType = true;
			if( ((that.keepType==="resource") || (that.keepType==="relmarker") || (that.keepType==="enum")
				|| (that.keepType==="relationtype") || (that.keepType==="fieldsetmarker"))
				 && el.value!==that.keepType){
			changeToNewType = confirm("If you change the type to '"+el.value+
											"' you will lost all your vocabulary settings for type '"+that.keepType+
										"'.\n\nAre you sure?");
		}

		if(changeToNewType) {
				//clear hidden fields
				if (!isInitialCall){
					Dom.get("dty_JsonTermIDTree").value = "";
					Dom.get("dty_TermIDTreeNonSelectableIDs").value = "";
					Dom.get("dty_PtrTargetRectypeIDs").value = "";
					Dom.get("dty_FieldSetRecTypeID").value = "";
						that.keepType = el.value;
						_recreateTermsPreviewSelector(that.keepType, null, null);
						_recreateRecTypesPreview(that.keepType, null);
				}
		}else{
					el.value = that.keepType;  //rollback
		}

		// setting visibility
		switch(el.value)
		{
		case "resource":
			Dom.get("pnl_relmarker").style.display = "block";
			break;
		case "relmarker":
			Dom.get("pnl_relmarker").style.display = "block";
		case "enum":
		case "relationtype":
			Dom.get("pnl_enum").style.display = "block";
			break;
		case "fieldsetmarker":
			Dom.get("pnl_fieldsetmarker").style.display = "block";
			break;
		default:
		}
	}

	/**
	*	status selector listener
	*/
	function _onChangeStatus(e){

		var el = e.target;
		if(el.value === "reserved") {
			var changeToReserved = confirm("If you change the status to reserved," +
											" you will no longer be able to change any "+
											"fields of this detailtype after you save it.\n\nAre you sure?");
			if(changeToReserved) {
					_toggleAll(true, true);
			} else {
					el.value = that.keepStatus; //restore previous value
			}
		} else {
				that.keepStatus = el.value;
				_toggleAll(false, true);
			}
	}

	//public members
	var that = {

			/** Keeps current status for rollback if user decided to keep it */
			keepStatus: _keepStatus,
			/** Keeps current datatype for rollback  */
			keepType: _keepType,

			/**
			 *	Apply form - sends data to server and closes this pop-up window in case of success
			 */
			save : function () {
				_updateDetailTypeOnServer();
			},

			/**
			 *	handles change type event
			 */
			onChangeType : _onChangeType,

			/**
			 *	handles change status event
			 */
			onChangeStatus : _onChangeStatus,

			/**
			 *	handles change status event
			 */
			onSelectTerms : _onSelectTerms,

			/**
			 *	handles change status event
			 */
			onSelectRectype : _onSelectRectype,

			/**
			 * Cancel form - checks if changes were made, shows warning and closes the window
			 */
			cancel : function () {
				_fromUItoArray(false);
				if(_updatedFields.length > 0) {
					var areYouSure = confirm("Changes were made. By cancelling, all changes will be lost. Are you sure?");
					if(areYouSure) {
						window.close(null);
					}
				}else{
					window.close(null);
				}
			},

			getClass: function () {
				return _className;
			},

			isA: function (strClass) {
				return (strClass === _className);
		}

	};

		_init();  // initialize before returning
		return that;
}
