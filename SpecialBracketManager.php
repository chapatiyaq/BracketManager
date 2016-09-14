<?php
class SpecialBracketManager extends SpecialPage {
	private $otherFields;

	function __construct() {
		parent::__construct( 'BracketManager' );

		$this->otherFields = array(
			'date' => 'Date',
			'preview' => 'Preview',
			'lrthread' => 'LR Thread',
			'interview' => 'Interview',
			'recap' => 'Recap',
			'comment' => 'Comment'
		);
	}

	function execute( $par ) {
		global $wgRequest, $wgOut;

		$this->setHeaders();
		
		$step = $wgRequest->getInt( 'step' );
		switch( $step ) {
		case 0:
			self::execute0( $par );
			break;
		case 1:
			self::execute1( $par );
			$wgOut->addWikiText( "==Flags==\n{{Template:Flag/doc}}" );
			break;
		default:
		}
	}

	/**** Page 0 ****/
	function execute0( $par ) {
		global $wgOut;
		$wgOut->addModules( 'ext.bracketManager.SpecialPage0' );

		self::execute0_openTabsViewsDiv();
		self::execute0_addTabs();
		self::execute0_addViews();		
		self::execute0_closeTabsViewsDiv();
	}

	function execute0_openTabsViewsDiv() {
		global $wgOut;
		$wgOut->addHTML( '<div id="bm-tabs" class="view-control-tabs">' );
	}

	function execute0_addTabs() {
		global $wgOut;
		
		$output = '
		<ul>
			<li><a href="#bm-view-create">Create</a></li>
			<li><a href="#bm-view-parse">Parse</a></li>
		</ul>';
		$wgOut->addHTML( $output );
	}

	function execute0_addViews() {
		self::execute0_addViewCreate();
		self::execute0_addViewParse();
	}

	function execute0_addViewCreate() {
		global $wgOut;
		
		$output = '
		<div id="bm-view-create">
			<form method="post" action="' . $this->getTitle()->getFullURL( 'step=1' ) . '" id="form-create">
				<input type="hidden" value="create" name="form" />
				<input type="hidden" value="1" name="step" />
				<label class="select" for="bracket">Template: </label>
		';

		$select = new XmlSelect(
			'bracket',
			'bracket'
		);
		$select->addOptions( self::getBracketOptions() );
		$output .= $select->getHTML();

		$output .= '<br/>
				<label>List the players (1 by line):</label><!--You can check the Bracket Help to know how many players you need to list for a specific bracket.-->
				<textarea id="players" rows="16" name="players"></textarea>
				<input type="submit" value="Create tournament" />
			</form>
		</div>';

		$wgOut->addHTML( $output );
	}

	function execute0_addViewParse() {
		global $wgOut;
		
		$output = '
		<div id="bm-view-parse">
			<p>Enter wikitext including a bracket template. The data will be parsed and used to build the bracket.<p>
			<form method="post" action="' . $this->getTitle()->getFullURL( 'step=1' ) . '" id="form-parse">
				<input type="hidden" value="parse" name="form" />
				<input type="hidden" value="1" name="step" />
				<textarea id="wikitext" rows="16" name="wikitext"></textarea>
				<input type="submit" value="Parse wikitext" />
			</form>
		</div>
		';
		$wgOut->addHTML( $output );
	}

	function execute0_closeTabsViewsDiv() {
		global $wgOut;
		$wgOut->addHTML( '</div>' );
	}

	/**** Page 1 ****/
	function execute1( $par ) {
		global $wgOut, $wgBracketManagerData;

		$wgOut->addModules( 'ext.bracketManager.SpecialPage1' );

		if ( !isset( $_POST['form'] ) ) {
			self::execute0( $par );
			return;
		}

		$bracketParser = new BracketManagerParser();

		switch( $_POST['form'] ) {
		case 'create':
			$wgBracketManagerData = $bracketParser->getDataForCreate( $_POST['bracket'], $_POST['players'] );
			break;
		case 'parse':
			$wgBracketManagerData = $bracketParser->getDataForParse( $_POST['wikitext'] );
			break;
		default:
			self::execute0( $par );
			return;
		}

		self::execute1_addBracket( $wgBracketManagerData->bracketId );
	}

	function execute1_addBracket( $bracketID ) {
		$output = '';

		self::execute1_addOptionsToolbar( $bracketID );
		self::execute1_addTabsViewsDiv();
	}

	function execute1_addOptionsToolbar( $bracketID ) {
		global $wgOut;

		$output = '
	<form method="post" action="' . $this->getTitle()->getFullURL( 'step=1' ) . '" id="bm-form-options">
		<div id="bm-options">
			<div class="options-group">
				<span class="label">Template</span>
				<span id="bm-template-title"></span>
				<span id="bm-full-manual-mode-indicator">(Full manual mode)</span>
				<a id="bm-change-bracket" href="javascript:;">change</a>
			</div><!--
			--><div id="bm-change-bracket-dialog">
				<label class="select" for="bm-bracket-select">Change to: </label>
		';

		$select = new XmlSelect(
			'bm-bracket-select',
			'bm-bracket-select',
			$bracketID
		);
		$select->addOptions( self::getBracketOptions() );
		$output .= $select->getHTML();
		
		$output .= '
				<div class="label">Mode:</div>
				<div class="radio-wrapper">
					<div class="item"><input id="bm-full-manual-mode-off" type="radio" value="0" name="bm-full-manual-mode" /></div>
					<div class="label-desc">
						<label for="bm-full-manual-mode-off">Semi-automated mode</label>
						<div class="description">
							In this mode, you can edit player information only where the player enters the bracket.
							The player progression into the bracket is then computed according to the scores.
						</div>
					</div>
				</div>
				<div class="radio-wrapper">
					<div class="item"><input id="bm-full-manual-mode-on" type="radio" value="1" name="bm-full-manual-mode" /></div>
					<div class="label-desc">
						<label for="bm-full-manual-mode-on">Full manual mode</label>
						<div class="description">
							In this mode, you can edit player information everywhere in the bracket. The player progression into the bracket is not computed.
						</div>
					</div>
				</div>
				<div class="label">Keep data:</div>
		';

		$dataToKeep = array( 'Flags', 'Races', 'Names', 'Scores', 'Match details' );
		foreach ( $dataToKeep as $dataItem ) {
			$dataItemID = 'bm-keep-' . strtolower( str_replace( ' ', '-', $dataItem ) );

			$output .= '
				<div class="checkbox-wrapper">
					<input id="' . $dataItemID . '" checked="" type="checkbox" value="1" name="' . $dataItemID . '" />
					<label for="'. $dataItemID . '">' . $dataItem . '</label>
				</div>
			';
		}
		$output .= '
				<p>This operation cannot be reverted. Some information may be lost.</p>
			</div><!--';

		/* END */

		$output .= '
			--><div class="options-group">
				<span id="bm-data-from-db" class="toolbar-span" alt="Pull data from player database" title="Pull data from player database"></span><!--
				--><div id="bm-data-from-db-dialog">
					<div class="intro">
						Exact matches: <span class="exact-match-count"></span>&nbsp;-&nbsp;
						Lowercase matches: <span class="lowercase-match-count"></span>&nbsp;-&nbsp;
						Other: <span class="other-match-count"></span>
					</div>
					<div class="header">
						<div class="source-name">Player</div>
						<div class="target-players">Replace, if checkbox is checked, by</div>
					</div>
					<div class="content"></div>
				</div><!--
				--><span id="bm-unnamed-to-bye" class="toolbar-span" alt="Change unnamed players to Bye" title="Change unnamed players to Bye">Change unnamed players to BYE</span><!--
				--><span id="bm-byes-lose" class="toolbar-span" alt="Byes lose their games" title="Byes lose their games">Byes lose their games</span>
			</div><!--
			--><div class="options-group">
				<input id="bm-show-third-place-match" checked="" type="checkbox" value="1" name="bm-show-third-place-match" /><!--
				--><label for="bm-show-third-place-match">Show 3rd place match</label>&nbsp
			</div><!--
			--><div class="options-group">
				<input id="bm-propagateRF" type="checkbox" value="1" name="bm-propagateRF" /><!--
				--><label for="bm-propagateRF">Propagate races and flags</label>
			</div>
		</div>
	</form>
		';

		$wgOut->addHTML( $output );
	}

	function execute1_addTabsViewsDiv() {
		self::execute1_openTabsViewsDiv();
		self::execute1_addTabs();
		self::execute1_addViews();		
		self::execute1_closeTabsViewsDiv();
	}

	function execute1_openTabsViewsDiv() {
		global $wgOut;
		$wgOut->addHTML( '<div id="bm-tabs" class="view-control-tabs">' );
	}

	function execute1_addTabs() {
		global $wgOut;

		$output = '
		<ul>
			<li><a href="#bm-view-bracket">Bracket</a></li>
			<li><a href="#bm-view-code">Code</a></li>
			<li><a href="#bm-view-participants">Participants</a></li>
			<li><a href="#bm-view-distribution">Racial Distribution</a></li>
			<li><a href="#bm-view-raw-match-list">Raw match list</a></li>
		</ul>';
		$wgOut->addHTML( $output );
	}

	function execute1_addViews() {
		self::execute1_addViewBracket();
		self::execute1_addViewCode();
		self::execute1_addViewParticipants();
		self::execute1_addViewRacialDistribution();
		self::execute1_addViewRawMatchList();
	}

	function execute1_addViewBracket() {
		self::execute1_openViewBracket();
		self::execute1_addBracketOptions();
		self::execute1_addBracketContainer();
		self::execute1_closeViewBracket();
	}

	function execute1_openViewBracket() {
		global $wgOut;
		$wgOut->addHTML( '<div id="bm-view-bracket">' );
	}

	function execute1_addBracketOptions() {
		global $wgOut;
		
		$output = '
			<div id="bm-bracket-options">
				<div class="options-group">
					<span id="bm-bold" class="toolbar-span" alt="Bold" title="Bold">Bold</span><!--
					--><span id="bm-italic" class="toolbar-span" alt="Italic" title="Italic">Italic</span>
				</div><!--
				--><div class="options-group">
					<input id="bm-show-race-icons" type="checkbox" value="1" name="bm-show-race-icons" /><!--
					--><label for="bm-show-race-icons">Show race icons</label>&nbsp;
				</div><!--
				--><div class="options-group">
					<input id="bm-seed-editor-mode" type="checkbox" value="1" name="bm-mode" /><!--
					--><label for="bm-seed-editor-mode">Seed editor mode</label>&nbsp;<!--
					--><input id="bm-match-details-mode" type="checkbox" value="1" name="bm-mode" /><!--
					--><label for="bm-match-details-mode">Match details</label>
				</div>
			</div>';
		$wgOut->addHTML( $output );
	}

	function execute1_addBracketContainer() {
		self::execute1_openBracketContainer();
		self::execute1_addMatchDetails();
		self::execute1_addBracketDiv();
		self::execute1_closeBracketContainer();
	}

	function execute1_openBracketContainer() {
		global $wgOut;
		$wgOut->addHTML( '<div id="bm-bracket-container">' );		
	}

	function execute1_addMatchDetails () {
		global $wgOut;

		$output = '<div id="bm-match-details">
					<div>
						<div class="player player1">
							<div class="bm-flag-edit prev"></div><!--
							--><div class="bm-race-edit-prev"></div><!--
							--><div class="name"></div>
						</div><!--
						--><div class="player player2">
							<div class="bm-flag-edit prev"></div><!--
							--><div class="bm-race-edit-prev"></div><!--
							--><div class="name"></div>
						</div>
					</div>
					<div class="games">
						<div class="games-header">
							<div class="map-number"></div><!--
							--><div class="map-enabled"></div><!--
							--><div class="map">Map</div><!--
							--><div class="mapwin">Win</div><!--
							--><div class="vodgame">VOD</div>
						</div>
						<div class="games-contents">';
		for ( $i = 1; $i <= 9; $i++ ) {
			$output .= '
							<div class="game" id="game-' . $i . '">
								<div class="map-number">' . $i . '</div><!--
								--><div class="mapenabled"><div><input type="checkbox" class="map-enabled-edit" id="map-enabled-edit-' . $i . '"/></div></div><!--
								--><div class="map"><div><input type="text" class="map-edit" id="map-edit-' . $i . '"/></div></div><!--
								--><div class="mapwin"><div><input type="text" class="mapwin-edit" id="mapwin-edit-' . $i . '"></div></div><!--
								--><div class="vodgame"><div><input type="text" class="vodgame-edit" id="vodgame-edit-' . $i . '"></div></div>
							</div>';
		}
		$output .= '
						</div>
					</div>
					<div class="other-fields">';

		foreach ( $this->otherFields as $field => $label ) {
			$output .= '
						<div class="' . $field . '">
							<label>' . $label . ': </label>
							<input type="text" class="' . $field . '-edit"/>
						</div>';
		}
		$output .= '
					</div>
					<div class="extended-series-div">
						<input type="checkbox" id="extended-series"/>
						<label for="extended-series">Extended series</label>
					</div>
				</div>';
		$wgOut->addHTML( $output );
	}

	function execute1_addBracketDiv () {
		global $wgOut;

		$output = '
				<div id="bm-bracket-div">
					<div class="spinner">Loading...</div>
				</div>';
		$wgOut->addHTML( $output );
	}

	function execute1_closeBracketContainer() {
		global $wgOut;
		$wgOut->addHTML( '</div>' );
	}

	function execute1_closeViewBracket() {
		global $wgOut;
		$wgOut->addHTML( '</div>' );
	}

	function execute1_addViewCode() {
		global $wgOut;

		$output = '
		<div id="bm-view-code">
			<div id="bm-code-options">
				<h3><a href="javascript:;">Code options</a></h3>
				<div>
					<span>Change the order of fields, and show/hide races and flags:</span>
					<ul id="bm-code-player-fields">';

		$codeItems = array(
			'name'  => array( 'label' => 'Name',  'disabled' => true ),
			'race'  => array( 'label' => 'Race',  'disabled' => false ),
			'flag'  => array( 'label' => 'Flag',  'disabled' => false ),
			'score' => array( 'label' => 'Score', 'disabled' => true ),
			'win'   => array( 'label' => 'Win',   'disabled' => false )
		);
		$fieldOrder = 1;
		foreach ( $codeItems as $id => $attribs ) {
			$output .= '
						<li class="ui-state-default bm-code-option-field" id="bm-code-option-field-' . $id . '">
							<span class="ui-icon ui-icon-arrowthick-2-e-w"></span>
							<input id="bm-show-' . $id . '-code" checked="" ' . ( $attribs['disabled'] ? 'disabled="" ' : '' ) . 'type="checkbox" value="1" name="bm-show-' . $id . '-code" />
							<label for="bm-show-' . $id . '-code">' . $attribs['label'] . '</label>
						</li>';
			$fieldOrder++;
		}
		$output .= '
					</ul>';

		$output .= '
					<h5>Bracket template parameters</h5>
					<div id="bm-player-cell-width-div">
						<input id="bm-player-cell-width" type="checkbox" value="1" name="bm-player-cell-width" />
						<label for="bm-player-cell-width">Player/Team cell width</label>
						<input id="bm-player-cell-width-value" size="6" name="bm-player-cell-width-value" />
					</div>
					<div id="bm-score-cell-width-div">
						<input id="bm-score-cell-width" type="checkbox" value="1" name="bm-score-cell-width" />
						<label for="bm-score-cell-width">Score cell width</label>
						<input id="bm-score-cell-width-value" size="6" name="bm-score-cell-width-value" />
					</div>
					<div id="bm-hide-round-titles-div">
						<input id="bm-hide-round-titles" type="checkbox" value="1" name="bm-hide-round-titles" />
						<label for="bm-hide-round-titles">Hide round titles</label>
					</div>

					<h5>Match details / BracketMatchSummary template parameters</h5>
					<input id="bm-show-match-details" type="checkbox" value="1" name="bm-show-match-details" />
					<label for="bm-show-match-details">Show match details</label>
					<table class="other-fields-parameters">
						<tr>
							<th class="label"></th>
							<th class="option">Always displayed</th>
							<th class="option">Hidden when empty</th>
							<th class="option">Always hidden</th>
						</tr>';

		foreach ( $this->otherFields as $field => $label ) {
			$output .= '
						<tr class="display-' . $field . '">
							<td class="label">' . $label . '</div>
							<td class="option"><input type="radio" name="display-' . $field . '" class="display-' . $field . '-edit" rel="' . $field . '" value="always-displayed" checked="checked"></div>
							<td class="option"><input type="radio" name="display-' . $field . '" class="display-' . $field . '-edit" rel="' . $field . '" value="hidden-when-empty"></div>
							<td class="option"><input type="radio" name="display-' . $field . '" class="display-' . $field . '-edit" rel="' . $field . '" value="always-hidden"></div>
						</tr>';
		}
		$output .= '
					</table>
					<h5>Other parameters</h5>
					<div id="bm-bold-winners-names-div">
						<input id="bm-bold-winners-names" type="checkbox" value="1" name="bm-bold-winners-names" />
						<label for="bm-bold-winners-names">Bold winners\' names (RxDy=\'\'\'name\'\'\')</label>
					</div>
				</div>
			</div>
			<span class="bm-code-label">Code:</span>
			<a id="bm-code-select-all" href="javascript:;">Select all</a>
			<div id="bm-bracket-code">No code to be displayed.</div>
		</div>';

		$wgOut->addHTML( $output );
	}

	function execute1_addViewParticipants() {
		global $wgOut;

		$output = '
		<div id="bm-view-participants">
			<span class="bm-code-label">Code:</span>
			<a id="bm-participants-select-all" href="javascript:;">Select all</a>
			<div id="bm-list-of-participants">No code to be displayed.</div>
		</div>';
		$wgOut->addHTML( $output );
	}
	
	function execute1_addViewRacialDistribution() {
		global $wgOut;

		$output = '
		<div id="bm-view-distribution">
			<span class="bm-code-label">Code:</span>
			<a id="bm-distribution-select-all" href="javascript:;">Select all</a>
			<div id="bm-racial-distribution">No code to be displayed.</div>
		</div>';
		$wgOut->addHTML( $output );
	}
		
	function execute1_addViewRawMatchList() {
		global $wgOut;

		$output = '
		<div id="bm-view-raw-match-list">
			<div id="bm-raw-match-list-options">
				<div class="options-group">
					<div class="label">Options</div>';

		$select = new XmlSelect(
			'one-line-per',
			'one-line-per'
		);
		$select->addOptions( array( 'One line per game' => 'game', 'One line per series' => 'series' ) );
		$output .= $select->getHTML();
		$output .= '
				</div>';
		
		$output .= '
				<div class="options-group">
					<label for="raw-match-list-format">Format</label>
					<input type="text" class="format" name="raw-match-list-format" size="100" value="\1\t\2\t\n\t\m"/>
				</div>
			</div>
			<span class="bm-code-label">Code:</span>
			<a id="bm-raw-match-list-select-all" href="javascript:;">Select all</a>
			<div id="bm-raw-match-list">No code to be displayed.</div>
			<span class="bm-code-label">Error log:</span>
			<div id="bm-raw-match-list-error-log"></div>
		</div>';
		$wgOut->addHTML( $output );
	}

	function execute1_closeTabsViewsDiv() {
		global $wgOut;
		$wgOut->addHTML( '</div>' );
	}

	function getBracketOptions() {
		$bracketOptions = array( '' => 0 );
		$dbr = wfGetDB( DB_SLAVE );
		$res = $dbr->select(
			'bm_brackets',
			array( 'name', 'type' ),
			'',
			__METHOD__,
			array( 'ORDER BY' => 'id ASC' )
		);
		while ( $row = $dbr->fetchObject( $res ) ) {
			$bracketOptions[ $row->type ][ $row->name ] = $row->name;
		}
		$dbr->freeResult( $res );

		return $bracketOptions;
	}
}