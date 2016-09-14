<?php
# Alert the user that this is not a valid entry point to MediaWiki if they try to access the special pages file directly.
if (!defined('MEDIAWIKI')) {
  echo <<<EOT
To install the Bracket Manager, put the following line in LocalSettings.php:
require_once( "$IP/extensions/BracketManager/BracketManager.php" );
EOT;
  exit( 1 );
}
 
$wgBracketManagerData = array();

$wgExtensionCredits['specialpage'][] = array(
    'path' => __FILE__,
    'name' => 'BracketManager',
    'author' => '[http://wiki.teamliquid.net/starcraft2/User:ChapatiyaqPTSM Chapatiyaq]',
    'url' => 'http://wiki.teamliquid.net/starcraft2/User:ChapatiyaqPTSM/BracketManager',
    'descriptionmsg' => 'bracketmanager-desc',
    'version' => '0.0.0',
);
$wgExtensionCredits['api'][] = array(
    'path' => __FILE__,
    'name' => 'BracketManager',
    'author' => '[http://wiki.teamliquid.net/starcraft2/User:ChapatiyaqPTSM Chapatiyaq]',
    'url' => 'http://wiki.teamliquid.net/starcraft2/User:ChapatiyaqPTSM/BracketManager',
    'descriptionmsg' => 'bracketmanager-desc',
    'version' => '0.0.0',
);
$dir = dirname(__FILE__) . '/';
 
$wgExtensionMessagesFiles['BracketManager'] = $dir . 'BracketManager.i18n.php';
$wgExtensionMessagesFiles['BracketManagerAlias'] = $dir . 'BracketManager.alias.php';

$wgAutoloadClasses['SpecialBracketManager'] = $dir . 'SpecialBracketManager.php';

$wgSpecialPages['BracketManager'] = 'SpecialBracketManager';
$wgSpecialPageGroups['BracketManager'] = 'other';

$bracketManagerTpl = array(
    'localBasePath' => dirname( __FILE__ ) . '/modules',
    'remoteExtPath' => 'BracketManager/modules',
    'group' => 'ext.bracketManager'
);

$wgAutoloadClasses['BracketManagerHooks'] = dirname( __FILE__ ) . '/BracketManager.hooks.php';
$wgHooks['MakeGlobalVariablesScript'][] = 'BracketManagerHooks::makeGlobalVariablesScript';

$wgResourceModules += array(
    'ext.bracketManager.SpecialPage0' => $bracketManagerTpl + array(
        'scripts' => 'ext.bracketManager.SpecialPage0.js',
        'styles' => 'ext.bracketManager.css',
        'dependencies' => 'jquery.ui.tabs'
    ),

    'ext.bracketManager.SpecialPage1' => $bracketManagerTpl + array(
        'scripts' => array(
            'jquery.ba-outside-events.js',
            'jquery.bracketManager.js',
            'ext.bracketManager.js',
            'ext.bracketManager.Data.js',
            'ext.bracketManager.Bracket.js',
            'ext.bracketManager.MatchDetails.js',
            'ext.bracketManager.CodeFunctions.js',
            'ext.bracketManager.Code.js',
            'ext.bracketManager.Participants.js',
            'ext.bracketManager.RacialDistribution.js',
            'ext.bracketManager.RawMatchList.js',
            'ext.bracketManager.SpecialPage1.js'
        ),
        'styles' => array(
            'ext.bracketManager.css',
            'ext.bracketManager.flag.css'
        ),
        'dependencies' => array( 
            'jquery.ui.tabs',
            'jquery.ui.accordion',
            'jquery.ui.sortable',
            'jquery.ui.draggable',
            'jquery.ui.droppable',
            'jquery.ui.dialog'
        )
    )
);

# Schema updates for update.php
$wgHooks['LoadExtensionSchemaUpdates'][] = 'bmSchemaUpdates';
function bmSchemaUpdates( DatabaseUpdater $updater ) {
    $updater->addExtensionTable( 'bm_brackets',
        dirname( __FILE__ ) . '/BracketManager.brackets.sql', true );
    $updater->addExtensionTable( 'bm_players',
        dirname( __FILE__ ) . '/BracketManager.players.sql', true );
    $updater->addExtensionTable( 'bm_aliases',
        dirname( __FILE__ ) . '/BracketManager.aliases.sql', true );
    return true;
}

$wgAutoloadClasses['BracketArchitecture'] = dirname( __FILE__ )
    . '/BracketArchitecture.php';
$wgAutoloadClasses['BracketManagerParser'] = dirname( __FILE__ )
    . '/BracketManagerParser.php';
$wgAutoloadClasses['ApiBracketManager'] = dirname( __FILE__ )
    . '/ApiBracketManager.php';
$wgAPIModules['bracketmanager'] = 'ApiBracketManager';

require_once( $dir . 'SpecialBracketManager.body.php' );