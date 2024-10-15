<?php

/**
* Creates archive packages for one, several or all databases.
* Writes the archive packages in _BATCH_PROCESS_ARCHIVE_PACKAGE
* See default argument values below to see what is/can be exported
* Runs from shell only
*
* @package     Heurist academic knowledge management system
* @link        https://HeuristNetwork.org
* @copyright   (C) 2005-2023 University of Sydney
* @author      Artem Osmakov   <osmakov@gmail.com>
* @author      Ian Johnson     <ian.johnson.heurist@gmail.com>
* @license     https://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @version     6
*/

/*
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except in compliance
* with the License. You may obtain a copy of the License at https://www.gnu.org/licenses/gpl-3.0.txt
* Unless required by applicable law or agreed to in writing, software distributed under the License is
* distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
* See the License for the specific language governing permissions and limitations under the License.
*/

// Default values for arguments
$arg_database = null;
$arg_skip_files = false;    // include all the uploaded files
$arg_include_docs = true;   // include full documentation to make the archive interpretable
$arg_skip_hml = true;       // don't include HML as this function is primarily intended for database transfer
                            // and HML is voluminous. HML should be included if this is intended as longer term archive.
$with_triggers = false;
$backup_root = null;

if (@$argv) {

// example:
//  sudo php -f /var/www/html/heurist/export/dbbackup/buildArchivePackagesCMD.php -- -db=database_1,database_2
//  sudo php -f buildArchivePackagesCMD.php -- -db=osmak_9,osmak_9c,osmak_9d
//  sudo php -f /var/www/html/heurist/export/dbbackup/buildArchivePackagesCMD.php -- -db=all -nofiles -nodocs

// TODO: It would be good if this had a parameter option to also delete the database for use when transferring to a new server
// TODO: WARNING: AT THIS TIME (21 May 2022) IT DOES NOT REPORT AN ERROR IF THERE IS NO FILESTORE FOLDER

    // handle command-line queries
    $ARGV = array();
    for ($i = 0;$i < count($argv);++$i) {
        if ($argv[$i][0] === '-') {
            if (@$argv[$i + 1] && $argv[$i + 1][0] != '-') {
                $ARGV[$argv[$i]] = $argv[$i + 1];
                ++$i;
            } else {
                if(strpos($argv[$i],'-db=')===0){
                    $ARGV['-db'] = substr($argv[$i],4);
                }else{
                    $ARGV[$argv[$i]] = true;
                }


            }
        } else {
            array_push($ARGV, $argv[$i]);
        }
    }
    if (@$ARGV['-db']) {$arg_database = $ARGV['-db'];}
    if (@$ARGV['-nofiles']) {$arg_skip_files = true;}
    if (@$ARGV['-hml']) {$arg_skip_hml = false;}
    if (@$ARGV['-nodocs']) {$arg_include_docs = false;}



}else{
    exit('This function must be run from the shell');
}

if($arg_database==null){
    exit("Required parameter -db is not defined\n");
}

use hserv\utilities\DbUtils;
use hserv\utilities\UArchive;

require_once dirname(__FILE__).'/../../autoload.php';

require_once dirname(__FILE__).'/../../hserv/records/search/recordFile.php';


//retrieve list of databases
$system = new hserv\System();
if( !$system->init(null, false,false) ){
    exit("Cannot establish connection to sql server\n");
}

$mysqli = $system->get_mysqli();
$databases = mysql__getdatabases4($mysqli, false);

if($arg_database=='all'){
    $arg_database = $databases;
}else{
    $arg_database = explode(',',$arg_database);
    if(empty($arg_database)){
        exit("Required parameter -db is not defined\n");
    }
    foreach ($arg_database as $db){
        if(!in_array($db,$databases)){
            exit("Database $db not found\n");
        }
    }
}

$upload_root = $system->getFileStoreRootFolder();
$backup_root = $upload_root.'_BATCH_PROCESS_ARCHIVE_PACKAGE/';

define('HEURIST_FILESTORE_ROOT', $upload_root );

if (!folderCreate($backup_root, true)) {
    exit("Failed to create backup folder $backup_root \n");
}


//flag that backup in progress
$action = 'backupDBs';
if(!isActionInProgress($action, 30)){
    exit("It appears that backup operation has been started already. Please try this function later");
}

if($with_triggers){
    $dump_options = array(
            'add-drop-table' => true,
            'single-transaction' => true,
            'skip-triggers' => false,
            'add-drop-trigger' => true,
            'databases' => true,
            'add-drop-database' => true);
}else{
    $dump_options = array('databases' => true,
                'add-drop-database' => true,
                'add-drop-table' => true,
                'single-transaction' => true,
                'skip-triggers' => true,
                'add-drop-trigger' => false);
}



set_time_limit(0);//no limit

foreach ($arg_database as $idx=>$db_name){

    echo "processing ".htmlentities($db_name)." ";//.'  in '.$folder

    $db_name = basename($db_name);
    $folder = $backup_root.$db_name.'/';
    $backup_zip = $backup_root.$db_name.'.zip';

    $database_folder = $upload_root.$db_name.'/';

    $folder_esc =  htmlentities($folder);
    $db_name_esc = htmlentities($db_name);
    
    if(file_exists($folder)){
        $res = folderDelete2($folder, true);//remove previous backup
        if(!$res){
            
            if(file_exists($progress_flag)) {unlink($progress_flag);}
            exit("Cannot clear existing backup folder $folder_esc \n");
        }
    }

    if(!file_exists($database_folder)){
        echo "skipped (database folder is missed)\n";
        continue;
    }


    if (!folderCreate($folder, true)) {
        if(file_exists($progress_flag)) {unlink($progress_flag);}
        exit("Failed to create folder $folder_esc in which to create the backup \n");
    }

    echo "files.. ";
    $folders_to_copy = null;

    //copy resource folders
    if($arg_include_docs){
        //Exporting system folders

        //get all folders except backup, scratch, file_uploads and filethumbs
        $folders_to_copy = folderSubs($database_folder, array('backup', 'scratch', 'file_uploads', 'filethumbs', 'webimagecache', 'blurredimagescache'));

        // this is limited set of folder

    }

    if(!$arg_skip_files){
        if($folders_to_copy==null) {$folders_to_copy = array();}
        $folders_to_copy[] = $database_folder.'file_uploads/';
        $folders_to_copy[] = $database_folder.'filethumbs/';

        $copy_files_in_root = true; //copy all files within database folder
    }else{
        $copy_files_in_root = false;
    }



    if($folders_to_copy==null){
        $folders_to_copy = array('no copy folders');
    }


    if($arg_include_docs || !$arg_skip_files){
        folderRecurseCopy( $database_folder, $folder, $folders_to_copy, null, $copy_files_in_root);
    }

    // Export database definitions as readable text
    echo "sql.. ";

    // Do an SQL dump of the whole database
    $dumpfile = $folder."/".$db_name."_MySQL_Database_Dump.sql";

    $res = DbUtils::databaseDump($db_name, $dumpfile, $dump_options);
    if($res===false){
        if(file_exists($progress_flag)) {unlink($progress_flag);}

        $err = $system->getError();
        error_log('buildArchivePackagesCMD Error: '.@$err['message']);

        exit("Sorry, unable to generate MySQL database dump for $db_name_esc. ".$err['message']."\n");
    }
/*
    try{
        $pdo_dsn = 'mysql:host='.HEURIST_DBSERVER_NAME.';dbname=hdb_'.$db_name.';charset=utf8mb4';
        $dump = new Mysqldump( $pdo_dsn, ADMIN_DBUSERNAME, ADMIN_DBUSERPSWD, $dump_options);
        $dump->start($dumpfile);
    } catch (Exception $e) {
        if(file_exists($progress_flag)) {unlink($progress_flag);}
        exit("Sorry, unable to generate MySQL database dump for $db_name.".$e->getMessage()."\n");
    }
*/
     echo "zip.. ";

    // Create a zipfile of the definitions and data which have been dumped to disk
    $destination = $backup_zip;
    if(file_exists($destination)) {unlink($destination);}
    $res = UArchive::zip($folder, null, $destination, false);

    folderDelete2($folder, true);

    if(!$res){
        if(file_exists($progress_flag)) {unlink($progress_flag);}
        $destination = htmlentities($destination);
        exit("Database: $db_name_esc Failed to create zip file at $destination \n");
    }

    echo "   $db_name_esc OK \n";//.'  in '.$folder
}//for

if(file_exists($progress_flag)) {unlink($progress_flag);}

exit("\nfinished all requested databases, results in HEURIST_FILESTORE/_BATCH_PROCESS_ARCHIVE_PACKAGE/
\n\n");
?>