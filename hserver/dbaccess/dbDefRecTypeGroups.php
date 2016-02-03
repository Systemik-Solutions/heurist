<?php

    /**
    * db access to sysUGrpps table
    * 
    *
    * @package     Heurist academic knowledge management system
    * @link        http://HeuristNetwork.org
    * @copyright   (C) 2005-2015 University of Sydney
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

require_once (dirname(__FILE__).'/../System.php');
require_once (dirname(__FILE__).'/DbEntitySearch.php');


class DbDefRecTypeGroups
{
    private $system;  
    
    /*  
     parametrs
    
     list of fields to search or update
     
    
    */    
    private $data;  
    
    //data types: ids, int, float, date, bool, enum
    private static $fields = array( 
    'rtg_ID'=>'ids',    //ids
    'rtg_Name'=>63,     //title
    'rtg_Domain'=>array('functionalgroup','modelview'),
    'rtg_Order'=>'int',
    'rtg_Description'=>250,
    'rtg_Modified'=>'date'
    );
    
    function __construct( $system, $data ) {
       $this->system = $system;
       $this->data = $data;
    }

    /**
    *  search user or/and groups
    * 
    *  sysUGrps.ugr_ID
    *  sysUGrps.ugr_Type
    *  sysUGrps.ugr_Name
    *  sysUGrps.ugr_Enabled
    *  sysUGrps.ugr_Modified
    *  sysUsrGrpLinks.ugl_UserID
    *  sysUsrGrpLinks.ugl_GroupID
    *  sysUsrGrpLinks.ugl_Role
    *  (omit table name)
    * 
    *  other parameters :
    *  details - id|name|list|all or list of table fields
    *  offset
    *  limit
    *  request_id
    * 
    *  @todo overwrite
    */
    public function search(){
        
//error_log(print_r($this->data,true));        
        $this->searchMgr = new DbEntitySearch( $this->system, DbDefRecTypeGroups::$fields);

        /*
        if (!(@$this->data['val'] || @$this->data['geo'] || @$this->data['ulfID'])){
            $this->system->addError(HEURIST_INVALID_REQUEST, "Insufficent data passed");
            return false;
        }
        
        if(!$this->_validateParamsAndCounts()){
            return false;
        }else if (count(@$this->recIDs)==0){
            return $this->result_data;
        }
        */
        $res = $this->searchMgr->validateParams( $this->data );
        if(!is_bool($res)){
            $this->data = $res;
        }else{
            if(!$res) return false;        
        }        
        
        //compose WHERE 
        $where = array();    
        
        $pred = $this->searchMgr->getPredicate('rtg_ID');
        if($pred!=null) array_push($where, $pred);

        $pred = $this->searchMgr->getPredicate('rtg_Name');
        if($pred!=null) array_push($where, $pred);

       
        //compose SELECT it depends on param 'details' ------------------------
        if(@$this->data['details']=='id'){
        
            $this->data['details'] = 'rtg_ID';
            
        }else if(@$this->data['details']=='name'){

            $this->data['details'] = 'rtg_ID,rtg_Name';
            
        }else if(@$this->data['details']=='list'){

            $this->data['details'] = 'rtg_ID,rtg_Name,rtg_Description,rtg_Order';
            
        }else if(@$this->data['details']=='full'){

            $this->data['details'] = implode(',', DbDefRecTypeGroups::$fields );
        }
        
        if(!is_array($this->data['details'])){ //specific list of fields
            $this->data['details'] = explode(',', $this->data['details']);
        }
        
        //validate names of fields
        foreach($this->data['details'] as $fieldname){
            if(!@DbDefRecTypeGroups::$fields[$fieldname]){
                $this->system->addError(HEURIST_INVALID_REQUEST, "Invalid field name ".$fieldname);
                return false;
            }            
        }

        //ID field is mandatory and MUST be first in the list
        $idx = array_search('rtg_ID', $this->data['details']);
        if($idx>0){
            unset($this->data['details'][$idx]);
            $idx = false;
        }
        if($idx===false){
            array_unshift($this->data['details'],'rtg_ID');
        }
        $is_ids_only = (count($this->data['details'])==1);
            
        //compose query
        $query = 'SELECT SQL_CALC_FOUND_ROWS DISTINCT '.implode(',', $this->data['details']).' FROM defRecTypeGroups';
                
         if(count($where)>0){
            $query = $query.' WHERE '.implode(' AND ',$where);
         }
         $query = $query.$this->searchMgr->getOffset()
                        .$this->searchMgr->getLimit();
        
//error_log($query);     

        $res = $this->searchMgr->execute($query, $is_ids_only);
        return $res;

    }
     
    
}
?>
