<?php
class BracketArchitecture {
	var $templateTitle;
	var $architecture;
	var $numPlayers;
	var $matchCycle;
	var $thirdPlaceMatchAvailable;
	var $html;

	private $bracketInfo;

	function __construct( $templateTitle ) {
		$this->templateTitle = $templateTitle;
		
		$this->architecture = array(
			'winnerTargets'          => array(),
			'loserTargets'           => array(),
			'loserEditScopes'        => array(),
			'sources'                => array(),
			'winnerPos'              => array(),
			'loserPos'               => array(),
			'allMatches'             => array(),
			'matchesWithAListMember' => array()
		);

		$dirArchitectures = dirname(__FILE__) . '/modules/bracketArchitectures/';
		$this->bracketInfo = json_decode(
			file_get_contents( $dirArchitectures. 'ext.bracketManager.' . $templateTitle . '.json' ),
			true
		);

		$this->numPlayers = $this->bracketInfo['maxNumberOfPlayers'];
		$this->matchCycle = array_keys( $this->bracketInfo[ 'matches' ] );
		$this->thirdPlaceMatchAvailable = isset( $this->bracketInfo[ 'thirdPlaceMatch' ] ) ? $this->bracketInfo[ 'thirdPlaceMatch' ] : false;

		self::bracketHTML();
	}

	function bracketHTML() {
		$output = '<div id="bm-bracket">';
		
		$sectionOutputs = array();
		// For each roundssection (roundssection = Winners Bracket or Losers Bracket or Grand Final)...
		foreach ( $this->bracketInfo[ 'structure' ] as $sectionType => $section ) {
			
			$sOutput = '<div class="bm-bracket-section" id="bm-bracket-' . $sectionType . '">';
			foreach ( $section as $hElement ) {
				switch ( $hElement['type'] ) {
				case 'main':
					$roundID = $hElement[ 'roundID' ];
					$sOutput .= '<div class="bm-hmain bm-hmain-' . $sectionType . '" id="bm-hmain-' . "$sectionType-$roundID" . '">';
					foreach ( $hElement['elements'] as $vElement ) {
						switch ( $vElement['type'] ) {
						case 'roundTitle':
							$roundTitleID = $vElement[ 'id' ];
							$roundTitleInfos = isset( $this->bracketInfo['roundTitles'][ $vElement['id'] ] ) ? $this->bracketInfo['roundTitles'][ $vElement['id'] ] : array();
							$sOutput .= self::makeRoundTitle( $roundTitleID, $roundTitleInfos );
							break;
						case 'roundSpacer':
							$sOutput .= '<div class="bm-roundspacer"></div>';
							break;
						case 'match':
							$matchInfos = isset( $this->bracketInfo['matches'][ $vElement['id'] ] ) ? $this->bracketInfo['matches'][ $vElement['id'] ] : array();
							$sOutput .= self::makeMatch( $vElement['id'], $matchInfos, 'classic' );
							break;
						case 'thirdPlaceMatchLabel':
							$roundTitleID = $vElement[ 'id' ];
							$roundTitleInfos = isset( $this->bracketInfo['roundTitles'][ $vElement['id'] ] ) ? $this->bracketInfo['roundTitles'][ $vElement['id'] ] : array();
							$sOutput .= self::makeRoundTitle( $roundTitleID, $roundTitleInfos, 'third-place-match-label' );
							break;
						case 'thirdPlaceMatch':
							$matchInfos = isset( $this->bracketInfo['matches'][ $vElement['id'] ] ) ? $this->bracketInfo['matches'][ $vElement['id'] ] : array();
							$sOutput .= self::makeMatch( $vElement['id'], $matchInfos, 'third-place' );
							break;
						case 'linespacer':
							$height = isset ( $vElement[ 'height' ] ) ? $vElement[ 'height' ] : 1;
							$height = $height * 27;
							$sOutput .= '<div class="bm-linespacer" style="height:' . $height . 'px;"></div>';
						}
					}
					$sOutput .= '</div>';
					break;
				case 'connectors':
					$width = isset( $hElement['width'] ) ? $hElement['width'] : '27px';
					$sOutput .= '<div class="bm-connectors" style="width:' . $width . ';">';
					$sOutput .= self::makeConnectors( $hElement['elements'], $this->bracketInfo['roundTitles'] );
					$sOutput .= '</div>';
				}
			}
			$sOutput .= '</div>';

			$sectionOutputs[ $sectionType ] = $sOutput;
		}

		if ( isset( $sectionOutputs['winner'] ) && isset( $sectionOutputs['loser'] ) && isset( $sectionOutputs['final'] ) ) {
			$output .= '<div class="bm-bracket-left">';
			$output .= $sectionOutputs['winner'];
			$output .= $sectionOutputs['loser'];
			$output .= '</div>';
			$output .= $sectionOutputs['final'];
		} else {
			$output .= implode( '', $sectionOutputs );
		}

		$output .= '</div>';

		$this->html = $output;
	}

	function makeRoundTitle ( $roundTitleID, $roundTitleInfos, $class = '' ) {
		$text = $roundTitleInfos['text'];
		$editable = !isset( $roundTitleInfos['non-editable'] ) || !$roundTitleInfos['non-editable'];
		$output = '<div class="bm-round-title' . ( $class ? " $class" : '' ) . '" id="bm-round-title-' . $roundTitleID . '">';
		if ( $editable ) {
			$output .= Html::input(
				'bm-round-title-edit-' . $roundTitleID,
				$text,
				'text',
				array(
					'class' => 'bm-round-title-edit',
					'id' => 'bm-round-title-edit-' . $roundTitleID
				)
			);
		} else {
			$output .= '<span id="bm-round-title-text-' . $roundTitleID . '">' . $text . '</span>';
		}
		$output .= '</div>';

		return $output;
	}

	function makeMatch ( $matchID, $matchInfos, $class ) {
		$secondSeries = isset( $matchInfos['secondSeries'] ) && $matchInfos['secondSeries'];
		$loserEditScope = isset( $matchInfos['loserEditScope'] ) ? $matchInfos['loserEditScope'] : '';

		$output = '<div class="bm-match ' . $class . ( $secondSeries ? ' two-series-match' : '' ) . '" id="bm-match-' . $matchID . '">';
		$output .= '<div class="bm-match-id">▼ ' . $matchID . '</div>';
		if ( $loserEditScope ) {
			$output .= '<div class="bm-match-loserEdit-seed bm-match-loserEdit-seed-' . $loserEditScope . '" id="bm-match-loserEdit-seed-' . $matchID . '"></div>';
		}
		$output .= '<div class="bm-match-overlay"></div>';
		$output .= self::makeMatchLine( 'top', $matchID, $matchInfos['player1'], $secondSeries );
		$output .= self::makeMatchLine( 'btm', $matchID, $matchInfos['player2'], $secondSeries );
		$output .= '</div>';

		$this->architecture[ 'winnerPos' ][ $matchID ] = 0;
		$this->architecture[ 'loserPos' ][ $matchID ] = 0;
		$this->architecture[ 'allMatches' ][] = $matchID;

		return $output;
	}

	function makeMatchLine ( $vPos, $matchID, $playerInfo, $secondSeries ) {
		list( $sourceType, $sourceID ) = explode( ':', $playerInfo['source'] );
		$playerID = $matchID . ( $vPos == 'top' ? '-1' : '-2' );

		if ( $sourceType == 'list'
		  && !in_array( $matchID, $this->architecture['matchesWithAListMember'] ) ) {
			$this->architecture['matchesWithAListMember'][] = $matchID;
		}

		// BODY DATA
		if ( $sourceType == 'winner'
		|| $sourceType == 'loser'
		|| $sourceType == 'loserEdit' ) {
			$sourceb = $sourceType == 'loserEdit' ? 'loser' : $sourceType;
			$this->architecture[ $sourceb . 'Targets' ][ $sourceID ][] = $playerID;
			$this->architecture[ 'sources' ][ $playerID ][ 0 ] =
				(object) array( 'type' => $sourceb, 'match' => $sourceID );
		}

		$output = '<div class="bm-match-line">';

		$output .= '<div class="bm-match-player bm-match-source-' . $sourceType . ' bm-match-' . $vPos . '" id="' . $playerID . '">';

		if ( $sourceType == 'list' ) {
			$output .= '<div class="bm-match-move' . " bm-match-move-$vPos" . " bm-match-move-list" . ' bm-match-move-droppable" id="' . "bm-match-move-list-droppable-$playerID" . '"></div>';
			$output .= '<div class="bm-match-move' . " bm-match-move-$vPos" . " bm-match-move-list" . ' bm-match-move-draggable" id="' . "bm-match-move-list-draggable-$playerID" . '"></div>';
		} else if ( $sourceType == 'loserEdit' ) {
			$loserEditScope = isset( $playerInfo[ 'loserEditScope' ] ) ? $playerInfo[ 'loserEditScope' ] : '';
			$classes = array(
				"bm-match-loserEdit-target",
				"bm-match-loserEdit-target-$vPos",
				"bm-match-loserEdit-target-$loserEditScope"
			);
			$output .= '<div class="' . implode( ' ', $classes ) . '" id="' . "bm-match-loserEdit-target-$playerID" . '"></div>';
			$output .= '<div class="bm-match-loserEdit-info" id="' . "bm-match-loserEdit-info-$playerID" . '">';
			$output .= '<div class="bm-match-loserEdit-info-text" id="' . "bm-match-loserEdit-info-text-$playerID" . '">Loser of ' . $sourceID . '</div>';
			$output .= '<div class="bm-match-loserEdit-remove" id="' . "bm-match-loserEdit-remove-$playerID" . '"></div>';
			$output .= '</div>';
		}
		
		$output .= '<div class="bm-match-score bm-match-score-1">';
		$output .= '<input class="bm-score-edit bm-score-1-edit" id="bm-score-edit-' . $playerID . '"  size="1"/>';
		$output .= '</div>';

		if ( $secondSeries ) {
			$output .= '<div class="bm-match-score bm-match-score-2">';
			$output .= '<input class="bm-score-edit bm-score-2-edit" id="bm-score-2-edit-' . $playerID . '"  size="1"/>';
			$output .= '</div>';
		}
		
		$output .= '<div class="bm-match-player-data">';
		
		$output .= '&nbsp;';
		$output .= '<div class="bm-match-flag" id="bm-match-flag-' . $playerID . '">';
		$output .= '<span class="bm-flag-edit bm-flag-0" id="bm-flag-edit-' . $playerID . '" alt="0" title="0">0</span>';
		
		$output .= '<div class="bm-flag-edit-helper" id="bm-flag-edit-helper-' . $playerID . '">';
		$output .= Html::input(
			'bm-flag-edit-text-' . $playerID,
			'',
			'text',
			array(
				'class'    => 'bm-flag-edit-text',
				'id'       => 'bm-flag-edit-text-' . $playerID
			)
		);
		$output .= Html::element( 'span', array(
				'class' => implode( ' ', array(
					'bm-flag-edit',
					'prev',
					'bm-flag-0'
				) ),
				'id'    => 'bm-flag-edit-prev-' . $playerID,
				'alt'   => '0',
				'title' => '0',
				'tabindex' => '0'
			),
			'0'
		);
		$output .= '</div>';
		
		$output .= '</div>';

		$output .= '&nbsp;';
		$output .= '<div class="bm-match-race" id="bm-match-race-' . $playerID . '">';
		$output .= '<span class="bm-race-edit bm-race-edit-0" id="bm-race-edit-' . $playerID . '" alt="0" title="0" tabindex="0">0</span>';
		
		$output .= '<div class="bm-race-edit-helper" id="bm-race-edit-helper-' . $playerID . '">';
		$races_list = array( 'p', 'z', 't', 'r', 'BYE' );
		foreach( $races_list as $r ) {
			$output .= Html::element( 'span',
				array(
					'class' => implode( ' ', array(
						'bm-race-edit-prev',
						//$sourceType . '-' . $id,
						'bm-race-edit-' . $r
					) ),
					'id'    => 'bm-race-edit-' . $r . '-' . $playerID,
					'alt'   => $r,
					'title' => $r
				),
				$r
			);
			$output .= '&nbsp;';
		}
		$output .= Html::element( 'span',
			array(
				'class' => implode( ' ', array(
					'bm-race-edit-prev',
					//$sourceType . '-' . $id,
					'bm-race-edit-0'
				) ),
				'id'    => 'bm-race-edit-0-' . $playerID,
				'alt'   => 'Unknown',
				'title' => 'Unknown'
			),
			'Unknown'
		);
		$output .= '</div>';

		$output .= '</div>';

		$output .= '&nbsp;';
		$output .= '<div class="bm-match-name" id="bm-match-name-' . $playerID . '">';
		$output .= '<input type="text" class="bm-name-edit" id="bm-name-edit-' . $playerID. '" tabindex="0"/>';
		$output .= '</div>';

		$output .= '</div>';

		$output .= '</div>';
		$output .= '</div>';
		
		return $output;
	}

	function makeConnectors( $vElements, $roundTitles ) {
		$output = '';

		foreach ( $vElements as $vElement ) {
			switch ( $vElement[ 'type' ] ) {
			case 'repeat':
				$coreOutput = self::makeConnectors( $vElement['core'], $roundTitles );
				$betweenOutput = self::makeConnectors( $vElement['between'], $roundTitles );
				for ( $i = 0; $i < $vElement['iterations'] - 1; $i++ ) {
					$output .= $coreOutput . $betweenOutput;
				}
				$output .= $coreOutput;
				break;
			case 'roundSpacer':
				$output .= '<div class="bm-roundspacer"></div>';
				break;
			case 'roundTitle':
				$roundTitleID = $vElement[ 'id' ];
				$roundTitleInfos = isset( $roundTitles[ $vElement['id'] ] ) ? $roundTitles[ $vElement['id'] ] : array();
				$output .= self::makeRoundTitle( $roundTitleID, $roundTitleInfos );
				break;
			case 'spacer':
				$height = isset ( $vElement[ 'height' ] ) ? $vElement[ 'height' ] : '27px';
				$output .= '<div class="bm-spacer" style="height:' . $height . ';"></div>';
				break;
			case '¯|_':
				$height = isset ( $vElement[ 'height' ] ) ? $vElement[ 'height' ] : '16px';
				$break = isset ( $vElement[ 'break' ] ) ? $vElement[ 'break' ] : '14';
				$output .= '<div class="bm-cnx" style="height:' . $height . ';">';
				$output .= '<div style="height:50%; width: 100%">';
				$output .= '<div style="height:100%; width:' . $break . 'px; float: left; border-top-right-radius: 3px; border-width: 2px 2px 0 0;"></div>';
				$output .= '</div>';
				$output .= '<div style="height:50%; width: 100%">';
				$output .= '<div style="height:100%; margin-left:' . ($break - 2) . 'px; border-bottom-left-radius: 3px; border-width: 0 0 2px 2px;"></div>';
				$output .= '</div>';
				$output .= '</div>';
				break;
			case '_|¯':
				$height = isset ( $vElement[ 'height' ] ) ? $vElement[ 'height' ] : '16px';
				$break = isset ( $vElement[ 'break' ] ) ? $vElement[ 'break' ] : '14';
				$output .= '<div class="bm-cnx" style="height:' . $height . ';">';
				$output .= '<div style="height:50%; width: 100%">';
				$output .= '<div style="height:100%; margin-left:' . ($break - 2) . 'px; border-top-left-radius: 3px; border-width: 2px 0 0 2px;"></div>';
				$output .= '</div>';
				$output .= '<div style="height:50%; width: 100%">';
				$output .= '<div style="height:100%; width:' . $break . 'px; float: left; border-bottom-right-radius: 3px; border-width: 0 2px 2px 0;"></div>';
				$output .= '</div>';
				$output .= '</div>';
				break;
			case '|_':
				$height = isset ( $vElement[ 'height' ] ) ? $vElement[ 'height' ] : '16px';
				$break = isset ( $vElement[ 'break' ] ) ? $vElement[ 'break' ] : '14';
				$output .= '<div class="bm-cnx bm-cnx-red" style="height:' . $height . '; width: 100%">';
				$output .= '<div style="height:100%; margin-left:' . ($break - 2) . 'px; border-bottom-left-radius: 3px; border-width: 0 0 2px 2px;"></div>';
				$output .= '</div>';
				break;
			}
		}

		return $output;
	}
}