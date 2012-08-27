<?php

/**
 * editRectypeConstraints.php
 *
 *
 * @copyright (C) 2005-2010 University of Sydney Digital Innovation Unit.
 * @link: http://HeuristScholar.org
 * @license http://www.gnu.org/licenses/gpl-3.0.txt
 * @package Heurist academic knowledge management system
 * @todo
 **/

require_once(dirname(__FILE__).'/../../common/connect/applyCredentials.php');

// User must be system administrator or admin of the owners group for this database
if (!is_admin()) {
    print "<html><head><link rel=stylesheet href='../../common/css/global.css'></head><body><div class=wrap><div id=errorMsg><span>You must be logged in as system administrator to modify database structure</span><p><a href=".HEURIST_URL_BASE."common/connect/login.php?logout=1&amp;db=".HEURIST_DBNAME." target='_top'>Log out</a></p></div></div></body></html>";
	return;
}
?>
<html>
	<head>

		<meta http-equiv="content-type" content="text/html; charset=utf-8">
		<title>Manage Record type Constraints</title>

		<link rel=stylesheet href="../../common/css/global.css">

		<link rel="stylesheet" type="text/css" href="../../external/yui/2.8.2r1/build/container/assets/skins/sam/container.css">

		<!-- YUI -->
		<link rel="stylesheet" type="text/css" href="../../external/yui/2.8.2r1/build/fonts/fonts-min.css" />
		<link rel="stylesheet" type="text/css" href="../../external/yui/2.8.2r1/build/tabview/assets/skins/sam/tabview.css" />
		<script type="text/javascript" src="../../external/yui/2.8.2r1/build/yahoo-dom-event/yahoo-dom-event.js"></script>
		<script type="text/javascript" src="../../external/yui/2.8.2r1/build/element/element-min.js"></script>
		<!--script type="text/javascript" src="../../external/yui/2.8.2r1/build/history/history-min.js"></script!-->
		<script type="text/javascript" src="../../external/yui/2.8.2r1/build/json/json-min.js"></script>

		<!-- DATATABLE DEFS -->
		<link type="text/css" rel="stylesheet" href="../../external/yui/2.8.2r1/build/datatable/assets/skins/sam/datatable.css">
		<!-- datatable Dependencies -->
		<script type="text/javascript" src="../../external/yui/2.8.2r1/build/datasource/datasource-min.js"></script>
		<!-- OPTIONAL: Drag Drop (enables resizeable or reorderable columns) -->
		<script type="text/javascript" src="../../external/yui/2.8.2r1/build/dragdrop/dragdrop-min.js"></script>
		<!-- Source files -->
		<script type="text/javascript" src="../../external/yui/2.8.2r1/build/datatable/datatable-min.js"></script>
		<!-- END DATATABLE DEFS-->

		<!-- PAGINATOR
		<link rel="stylesheet" type="text/css" href="../../external/yui/2.8.2r1/build/paginator/assets/skins/sam/paginator.css">
		<script type="text/javascript" src="../../external/yui/2.8.2r1/build/paginator/paginator-min.js"></script>
		 END PAGINATOR -->

		<script type="text/javascript" src="../../external/yui/2.8.2r1/build/container/container-min.js"></script>

		<script type="text/javascript" src="../../external/jquery/jquery.js"></script>

        <link rel="stylesheet" type="text/css" href="../../common/css/global.css">
    	<link rel="stylesheet" type="text/css" href="../../common/css/admin.css">
		<style type="text/css">
			.yui-skin-sam .yui-dt td {
				margin:0;padding:0;
				border:none;
				text-align:left;
			}
			.yui-skin-sam .yui-dt-list td {
				border-right:none; /* disable inner column border in list mode */
			}
			.yui-skin-sam .yui-dt tr.inactive{/* inactive users */
				/*background-color: #EEE;*/
				color:#999 !important;
			}
			.yui-skin-sam .yui-dt tr.inactive *{/* inactive users */
				/*background-color: #EEE;*/
				color:#999 !important;
			}
			#yui-dt0-th-count,#yui-dt1-th-changed,#yui-dt1-th-limit{
				width:10px;
			}
			/*
			#yui-dt1-th-changed{
				width:10px;
			}
			#yui-dt1-th-limit{
				width:10px;
			}*/

			.labeldiv{
				display: inline-block;
				width: 60px;
				text-align: right;
			}
			.yui-dt table {
    			width: 800;
			}
			.listing{
			}
			.selection{
			}
			.activated{
				display:inline-block;
			}
			.deactivated{
				display:none;
			}

		</style>

	</head>

	<body class="popup yui-skin-sam" style="overflow:auto;">
    <div>

    	<div class="banner" id="titleBanner"><h2>Manage Record type Constraints</h2></div>

		<script type="text/javascript" src="../../common/js/utilsLoad.js"></script>
		<script type="text/javascript" src="../../common/js/utilsUI.js"></script>
		<script src="../../common/php/displayPreferences.php"></script>
		<script src="../../common/php/loadCommonInfo.php"></script>

		<script type="text/javascript" src="editRectypeConstraints.js"></script>

	<div id="page-inner">

		<div style="width:45%;display:inline-block;vertical-align: top;">

			<div style="height:30">

				<div style="padding:4px;">Constraints determine the type and number of relationships which can be created for each pair of entity types</div>

				<div id="tabContainer">
				</div>

				<!-- new constrain form -->
				<div id="pnlSelectPair" style="padding-top:5px;display:block;">
					<div style="display:inline-block;">
						<label>Source: </label>
						<select id="selSrcRectypes"></select>
						<label>Target: </label>
						<select id="selTrgRectypes"></select>
					</div>
					<div style="float:right; text-align:right;">
						<input type="button" tabindex="11" value="Add pair" title="Add entity pair"
								onClick="constraintManager.addConstraint();" />
					</div>
				</div>
			</div>

		</div>
		<div id="termsList" style="width:50%;display:none;vertical-align: top;">


			<div style="height:30">

				<h3 id="currPairTitle" style="padding:4px;"></h3>
				<div id="tabContainer2"></div>
				<!-- add button -->
				<div id="pnlAddTerm" style="text-align:left;padding-top:5px;">
					<input type="button" tabindex="11" value="Choose Terms" onClick="constraintManager.addTerms();" />
					<input type="button" tabindex="12" value="Add 'Any'" onClick="constraintManager.addAny();"
							id="btnAddAny" style="visibility:hidden;" />
				</div>
			</div>



		</div>

		<div class="help prompt">
		<hr/>
			<ul>
			<li>
				General Notes:
				<div style="padding-left: 25px;">
Constraints are applied from most specific to least specific<br/>
Only one constraint is allowed per source - target - term combination<br/>
Specify constraints in the most specific direction<br/>
for example:  Person-Person-IsParentOf (max 2 relationships)<br/>
rather than:   Person-Person-IsOffspringOf (unlimited relationships)<br/>
				</div>
			</li>
			<li>Fields:
				<ul>
<li>Source: The record type from which relationships will be established</li>
<li>Target: The record type to which relationships will point</li>
<li>Term: The term to be constrained (constraint is applied to the term and its children)</li>
<li>Limit: The maximum number of relationships which can be established using this combination (blank = unlimited)</li>
<li>Notes: Notes about the nature of the constraint</li>
				</ul>
			</li>


		</div>


	</div>
	</div>

	<script  type="text/javascript">

		//  starts initialization on load completion of this window
		function createManagerObj(){
			constraintManager = new  ConstraintManager();
		}
		YAHOO.util.Event.addListener(window, "load", createManagerObj);

	</script>

	</body>
</html>

