<?php

/*
* Copyright (C) 2005-2013 University of Sydney
*
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except
* in compliance with the License. You may obtain a copy of the License at
*
* http://www.gnu.org/licenses/gpl-3.0.txt
*
* Unless required by applicable law or agreed to in writing, software distributed under the License
* is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
* or implied. See the License for the specific language governing permissions and limitations under
* the License.
*/

/**
* databaseSummary.php
* request aggregation query for all records grouped by record type 
*
* @author      Tom Murtagh
* @author      Kim Jackson
* @author      Ian Johnson   <ian.johnson@sydney.edu.au>
* @author      Stephen White   <stephen.white@sydney.edu.au>
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @author      Jan Jaap de Groot    <jjedegroot@gmail.com>
* @copyright   (C) 2005-2013 University of Sydney
* @link        http://Sydney.edu.au/Heurist
* @version     3.1.0
* @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @package     Heurist academic knowledge management system
* @subpackage  !!!subpackagename for file such as Administration, Search, Edit, Application, Library
*/

    require_once(dirname(__FILE__).'/../common/connect/applyCredentials.php');
    require_once(dirname(__FILE__).'/../common/php/dbMySqlWrappers.php');
    require_once(dirname(__FILE__).'/parseQueryToSQL.php');
    require_once(dirname(__FILE__).'/../common/php/getRecordInfoLibrary.php');

    mysql_connection_select(DATABASE);

    $searchType = BOTH;
    $args = array();
    $publicOnly = false;

    // Building query
    $query = REQUEST_to_query("select rec_RecTypeID, count(*) as count ", $searchType, $args, null, $publicOnly);
    $query = substr($query, 0, strpos($query, "order by"));
    $query .= " group by rec_RecTypeID order by count DESC";

    $rtStructs = getAllRectypeStructures();
?>
<html>
    <head>

        <meta http-equiv="content-type" content="text/html; charset=utf-8">
        <title>Database Summary</title>

        <link rel="stylesheet" type="text/css" href="../common/css/global.css">
        <link rel="stylesheet" type="text/css" href="../external/d3/colpick.css">
        <style>
            /** Heurist table */
            #container, settings, #visualisation, svg {
                width: 100%;
                height: 100%;                 
            }

            h3 {
                padding: 3px;
                margin: 0px;
            }
            
            /** Table */ 
            #records {
                 overflow: scroll;
            }       
            
            table {
                table-layout: auto;
                border-width: 0 0 1px 1px;
                border-spacing: 0;
                border: none;
            }     
            
            caption {
                float: left;
            }

            td, th {
                vertical-align: top;
                margin: 0px; 
                padding: 1px;                    
            }
            
            .row:hover {
                background-color: #CCCCCC;
            } 
            
            a:hover, input:hover {
                text-decoration: none;
                cursor: pointer;
            }
            
            /** Settings */
            #visualisation {
                border-left: 1px dashed black;
            }
            
            svg {
                border-top: 1px dashed black;
            }
            
            #linecolor {
                display: inline-block; 
                width: 10px; 
                height: 10px; 
                border: 1px solid black; 
                background-color: #999;
            }
            
         

            /** D3 */
            /** Move records around */
            g:hover {
                cursor: move;
            }
            
            /** Lines between records */
            .link {
              fill: none;
              stroke-opacity: .6; 
              pointer-events: all;
             
            }
            
            .link:hover {
                cursor: help;
            }

            /** Circle around icon */
            circle.around {
                fill: #fff;
                stroke-width: 2px;
                stroke: #000;               
            }
            
            /** Text above circle */
            text {
                font-weight: bold;
                text-anchor: middle;
                fill: #a00;
                font: 10px sans-serif;
            }
            
            text.shadow {
                 stroke: #fff;
                 stroke-width: 3px;
                 stroke-opacity: .8;
            }
            
            
        </style>
        
        <script type="text/javascript" src="../external/jquery/jquery-ui-1.10.2/jquery-1.9.1.js"></script>
        <script type="text/javascript" src="../external/d3/d3.js"></script> 
        <script type="text/javascript" src="../external/d3/colpick.js"></script>
        <script type="text/javascript" src="../external/d3/fisheye.js"></script> 
        <script>
            function onrowclick(rt_ID, innewtab){
                var query = "?w=all&ver=1&db=<?=HEURIST_DBNAME?>&q=t:"+rt_ID;
                if(innewtab){
                    window.open("search.html?"+query, "_blank");
                    return false;
                }else{
                    top.HEURIST.search.executeQuery(query);
                    window.close();
                }
            }
        </script>
    </head>
    
    <body class="popup">
        <!-- Holds the record count table left (as small as possible), and the SVG visualisation on the right (as big as possible) -->
        <table id="container" width="100%" border="0" cellspacing="0" cellpadding="2">
            <tr>
                <td width="250px">
                    <!-- Record count table -->
                    <table id="records" cellpadding="4" cellspacing="1" border="1">
                         <caption><h3>Records</h3></caption>
                         <tr>
                            <th>ID</th>
                            <th>Icon</th>
                            <th>Record type</th>
                            <th>Link</th>
                            <th>Count</th>
                            <th>Show <input type='checkbox' id="show-all"></th>
                        </tr>
                        
                        <?php
                            // Put record types & counts in the table
                            $res = mysql_query($query);
                            $count = 0;
                            while ($row = mysql_fetch_row($res)) {
                                // ID
                                $rt_ID = $row[0];
                                echo "<tr class='row'>";
                                echo "<td align='center'>$rt_ID</td>";
                                
                                // Image
                                $rectypeImg = "style='background-image:url(".HEURIST_ICON_SITE_PATH.$rt_ID.".png)'";
                                $img = "<img src='../common/images/16x16.gif' title='".htmlspecialchars($rectypeTitle). "' ".$rectypeImg." class='rft' />";
                                echo "<td align='center'>$img</td>";
                                
                                // Title
                                $rectypeTitle = $rtStructs['names'][$rt_ID];
                                $title = htmlspecialchars($rectypeTitle);
                                echo "<td>".$title."</td>";
                                
                                // Links
                                $links =  "<a href='#' title='Open in current page' onclick='onrowclick($rt_ID, false)' class='internal-link'>&nbsp;</a>";
                                $links .= "<a href='#' title='Open in new page' onclick='onrowclick($rt_ID, true)' class='external-link'>&nbsp;</a>";
                                echo "<td>$links</td>";
                                
                                // Count
                                echo "<td align='center'>" .$row[1]. "</td>";
                                
                                // Show
                                if($count < 10) {
                                    echo "<td align='center'><input type='checkbox' class='show-record' name='" .$title. "' checked></td></tr>";
                                }else{
                                    echo "<td align='center'><input type='checkbox' class='show-record' name='" .$title. "'></td></tr>";
                                }
                                $count++;
                                
                            }//end while
                        ?>
                    </table>
                </td>

                <!-- D3 visualisation -->
                <td>
                    <table id="visualisation" cellpadding="4" cellspacing="1">
                         <tr>
                            <td height="1">
                                <!-- SETTINGS -->
                                <table id="settings" cellpadding="4" cellspacing="1" height="1%">
                                    <caption><h3>Settings</h3></caption>
                                    
                                    <!-- Line type -->
                                    <td>
                                        <i>Line type:</i>
                                        <select id="linetype">
                                            <option value="straight">straight</option>
                                            <option value="curved">curved</option>
                                        </select>
                                    </td>    
                                    
                                    <!-- Line color -->
                                    <td>
                                        <i>Line color:</i>
                                        <div id="linecolor"></div>
                                    </td>  
                                    
                                    <!-- Line thickness -->
                                    <td>
                                        <i>Line thickness:</i>
                                        <input id="linethickness" type="range" min="1" max="10" value="5"> 
                                    </td> 
                                </table>
                            </td>   
                         </tr>
                         <tr>
                            <td>
                                <!-- SVG -->
                                <svg>    
                                    <defs>
                                        <!-- Marker for line with a stroke-width of 0 -->
                                        <marker id="marker0" markerWidth="4" markerHeight="4" refx="-1" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 1 -->
                                        <marker id="marker1" markerWidth="5" markerHeight="5" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 2 -->
                                        <marker id="marker2" markerWidth="6" markerHeight="6" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 3 -->
                                        <marker id="marker3" markerWidth="7" markerHeight="7" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 4 -->
                                        <marker id="marker4" markerWidth="8" markerHeight="8" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 5 -->
                                        <marker id="marker5" markerWidth="9" markerHeight="9" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 6 -->
                                        <marker id="marker6" markerWidth="10" markerHeight="10" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 7 -->
                                        <marker id="marker7" markerWidth="11" markerHeight="11" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 8 -->
                                        <marker id="marker8" markerWidth="12" markerHeight="12" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                   
                                        <!-- Marker for line with a stroke-width of 9 -->
                                        <marker id="marker9" markerWidth="13" markerHeight="13" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                        
                                        <!-- Marker for line with a stroke-width of 10 -->
                                        <marker id="marker10" markerWidth="13" markerHeight="13" refx="-2" refy="0"
                                                viewBox="0 -5 10 10" markerUnits="userSpaceOnUse" orient="auto" fill='#000' opacity="0.6">
                                            <path d="M0,-5L10,0L0,5"></path>
                                        </marker> 
                                    </defs>    
                                </svg>
                            </td>
                         </tr>
                    </table>
                </td>
            </tr>
        </table>
        <script type="text/javascript" src="databaseSummary.js"></script>
    </body>

</html>