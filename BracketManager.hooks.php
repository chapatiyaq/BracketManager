<?php
/**
 * Hooks for Bracket Manager extension
 * 
 * @file
 * @ingroup Extensions
 */

class BracketManagerHooks {
	/**
	 * @param $vars array
	 * @return bool
	 */
	public static function makeGlobalVariablesScript( &$vars ) {
		global $wgBracketManagerData;

		$vars['wgBracketManagerData']= $wgBracketManagerData;
		return true;
	}
}