<?php
$wgAjaxExportList += array(
	'BracketManagerFunctions::updateBracket',
	'BracketManagerFunctions::updateCode',
	'BracketManagerFunctions::getRacialDistributionData',
	'BracketManagerFunctions::searchInDB'
);

class BracketManagerFunctions {
	public static function updateBracket ( $templateTitle ) {
		$bracket = new BracketArchitecture( $templateTitle );
		return json_encode( $bracket );
	}

	public static function updateCode ( $bracketTemplate ) {
		$dirArchitectures = dirname(__FILE__) . '/modules/bracketArchitectures/';
		$bracketInfo = json_decode(
			file_get_contents( $dirArchitectures. 'ext.bracketManager.' . $bracketTemplate . '.json' ),
			true
		);

		$code = '';

		$code .= self::line( self::templateBrackets( 'open' ) . self::templateTitle( $bracketInfo['title'] ) );
		
		$code .= self::line( self::parameter( 'hideroundtitles', 'true' ),
			array( 'bm-hideroundtitles' ) );
		$code .= self::line( self::parameter( 'name-width', '' ),
			array( 'bm-playerCellWidth' ) );
		$code .= self::line( self::parameter( 'score-width', '' ),
			array( 'bm-scoreCellWidth' ) );

		foreach( $bracketInfo['roundTitles'] as $roundTitleID => $roundTitleInfos ) {
			$editable = !isset( $roundTitleInfos['non-editable'] ) || !$roundTitleInfos['non-editable'];
			if ( $editable ) {
				$code .= self::line( self::parameter( $roundTitleID, $roundTitleInfos['text'] ),
					array( 'bm-roundtitle', $roundTitleID ),
					'bm-codeLine-' . $roundTitleID
				);
			}
		}

		$dNumber = $wNumber = array();
		$countSections = count( $bracketInfo[ 'structure' ] );
		$sectionCodes = array();

		// For each section
		// TODO? for -> foreach
		foreach ( $bracketInfo[ 'structure' ] as $sectionType => $section ) {
			$sectionCode = '';
			if ( $countSections > 1 ) {
				switch( $sectionType ) {
				case 'winner':
					$comment = 'WINNERS BRACKET';
					break;
				case 'loser':
					$comment = 'LOSERS BRACKET';
					break;
				case 'final':
					$comment = 'GRAND FINALS';
				}
				$sectionCode = self::line( self::comment( $comment ) );
			}
			
			$round = 1;
			$roundCodes = array();
			// For each round
			foreach ( $section as $hElement ) {
				$roundCode = '';
				
				if ( $hElement['type'] != 'main' )
					continue;

				if ( $countSections == 1 && $hElement['comment'] ) {
					$roundCode .= self::line( self::comment( $hElement['comment'] ) );
				}

				foreach ( $hElement['elements'] as $vElement ) {
					if ( $vElement['type'] == 'thirdPlaceMatch' ) {
						$roundCode .= self::emptyLine( array( 'bm-code-thirdPlaceMatch' ) );
						$roundCode .= self::line( self::comment( '3RD PLACE' ),
							array( 'bm-code-thirdPlaceMatch' ) );
					}

					if ( $vElement['type'] == 'match' || $vElement['type'] == 'thirdPlaceMatch' ) {
						$matchInfos = $bracketInfo['matches'][ $vElement['id'] ];
						$roundCode .= self::playerLine( $vElement['type'], 'top', $vElement['id'], $matchInfos['player1'] );
						$roundCode .= self::playerLine( $vElement['type'], 'btm', $vElement['id'], $matchInfos['player2'] );
						$secondSeries = isset( $matchInfos['secondSeries'] ) && $matchInfos['secondSeries'];
						if ( $secondSeries ) {
							$roundCode .= self::playerSecondLine( $vElement['type'], 'top', $vElement['id'], $matchInfos['player1'] );
							$roundCode .= self::playerSecondLine( $vElement['type'], 'btm', $vElement['id'], $matchInfos['player2'] );
						}
						$roundCode .= self::makeMatchDetailsLines( $vElement['type'], $vElement['id'] );
					}
				}

				$roundCodes[] = $roundCode;
			}

			$sectionCode .= implode( self::emptyLine(), $roundCodes );
			$sectionCodes[] = $sectionCode;
		}

		$code .= implode( self::emptyLine(), $sectionCodes );
		$code .= self::line( self::templateBrackets( 'close' ) );
		
		return json_encode( array( 'code' => $code ) );
	}

	private static function makeMatchDetailsLines ( $matchType, $id ) {
		$classes = array(
			'bm-gamedetails',
			'bm-code-' . $matchType,
			$id
		);
		$code = self::line( self::parameterHead( $id . 'details' ) . self::templateBrackets( 'open' ) . self::templateTitle( 'BracketMatchSummary' ), $classes );
		$code .= self::line( self::advancedParameter( array( 'class' => 'date', 'parameterHead' => 'date' ) ), array_merge( $classes, array( 'line-date' ) ) );
		for ( $i = 1; $i <= 9; $i++ ) {
			$code .= self::line(
				self::advancedParameter( array( 'class' => 'map', 'parameterHead' => "map$i", 'afterSpace' => true ) ) .
				self::advancedParameter( array( 'class' => 'mapwin', 'parameterHead' => "map{$i}win", 'afterSpace' => true ) ) . 
				self::advancedParameter( array( 'class' => 'vodgame', 'parameterHead' => "vodgame$i", 'afterSpace' => true ) ),
				array_merge( $classes, array( 'map-' . $i ) )
			);
		}
		$code .= self::line( self::advancedParameter( array( 'class' => 'preview', 'parameterHead' => 'preview' ) ), array_merge( $classes, array( 'line-preview' ) ) );
		$code .= self::line( self::advancedParameter( array( 'class' => 'lrthread', 'parameterHead' => 'lrthread' ) ), array_merge( $classes, array( 'line-lrthread' ) ) );
		$code .= self::line( self::advancedParameter( array( 'class' => 'interview', 'parameterHead' => 'interview' ) ), array_merge( $classes, array( 'line-interview' ) ) );
		$code .= self::line( self::advancedParameter( array( 'class' => 'recap', 'parameterHead' => 'recap' ) ), array_merge( $classes, array( 'line-recap' ) ) );
		$code .= self::line( self::advancedParameter( array( 'class' => 'field-comment', 'parameterHead' => 'comment' ) ), array_merge( $classes, array( 'line-comment' ) ) );
		$code .= self::line( self::templateBrackets( 'close' ), $classes );

		return $code;
	}

	private static function line ( $code, $classes = array(), $id = '' ) {
		$class = 'bm-codeLine';
		if ( is_array( $classes ) && !empty( $classes ) ) {
			$class .= ' ' . implode( ' ', $classes );
		}

		return Html::rawElement( 'div',
			array( 'class' => $class, 'id' => $id ),
			$code
		);
	}

	private static function templateBrackets ( $type = '' ) {
		switch ( $type ) {
		case 'open':
			$text = '{{';
			break;
		case 'close':
			$text = '}}';
			break;
		default:
			return '';
		}

		return Html::element( 'span',
			array( 'class' => 'bm-template-brackets ' . $type ),
			$text
		);
	}

	private static function templateTitle ( $title ) {
		return Html::element( 'span',
			array( 'class' => 'bm-template-title' ),
			$title
		);
	}

	private static function comment ( $text ) {
		$code  = Html::element( 'span', 
			array( 'class' => 'bm-comment-open' ),
			'<!--'
		);
		$code .= Html::element( 'span',
			array( 'class' => 'bm-comment-text' ),
			' ' . $text . ' '
		);
		$code .= Html::element( 'span',
			array( 'class' => 'bm-comment-close' ),
			'-->'
		);

		return $code;
	}

	private static function parameterHead ( $head ) {
		return Html::element( 'span',
			array( 'class' => 'bm-parameter-head' ),
			'|' . $head . '='
		);
	}

	private static function parameter ( $head, $value ) {
		$code  = Html::element( 'span',
			array( 'class' => 'bm-parameter-head' ),
			'|' . $head . '='
		);
		$code .= Html::element( 'span',
			array( 'class' => 'bm-parameter-value' ),
			$value
		);

		return $code;
	}

	private static function emptyLine ( $classes = array() ) {
		return self::line( Html::element( 'br' ), $classes );
	}

	private static function playerLine ( $matchType, $vPos, $matchID, $playerInfo ) {
		list( $sourceType, ) = explode( ':', $playerInfo['source'] );
		$playerID = $matchID . ( $vPos == 'top' ? '-1' : '-2' );
		$code = '';

		$fields = array (
			'name' => '',
			'race' => 'race',
			'flag' => 'flag',
			'score' => 'score',
			'win' => 'win'
		);
		foreach ( $fields as $field => $fieldParameterName ) {
			switch ( $field ) {
			case 'name':
				$beforeValue = '<span class="bold-quotes">\'\'\'</span>';
				break;
			case 'score':
				$beforeValue = '<span class="extended-series">' . self::templateBrackets( 'open' ) . self::templateTitle( 'es' ) . '<span class="bm-parameter-head">|</span></span>';
				break;
			default:
				$beforeValue = '';
			}

			switch ( $field ) {
			case 'name':
				$afterValue = '<span class="bold-quotes">\'\'\'</span>';
				break;
			case 'score':
				$afterValue = '<span class="extended-series">' . self::templateBrackets( 'close' ) . '</span>';
				break;
			default:
				$afterValue = '';
			}

			$code .= self::advancedParameter( array(
				'class' => $field,
				'parameterHead' => $playerInfo['tag'] . $fieldParameterName,
				'afterSpace' => true,
				'beforeValue' => $beforeValue,
				'afterValue' => $afterValue
			));
		}

		return self::line( $code,
			array(
				'bm-player',
				'bm-code-' . $matchType,
				'source-' . $sourceType,
				$playerInfo['tag'],
				$playerID
			),
			'bm-codeLine-' . $playerID
		);
	}

	private static function advancedParameter ( $options ) {

		$innerSpan  = self::parameterHead( isset( $options[ 'parameterHead' ] ) ? $options[ 'parameterHead' ] : '' );
		$innerSpan .= '<span class="bm-parameter-value">';
		$innerSpan .= isset( $options[ 'beforeValue' ] ) ? $options[ 'beforeValue' ] : '';
		$innerSpan .= '<span class="pure-value"></span>';
		$innerSpan .= isset( $options[ 'afterValue' ] ) ? $options[ 'afterValue' ] : '';
		$innerSpan .= '</span>';

		if ( isset( $options[ 'afterSpace' ] ) && $options[ 'afterSpace' ] ) {
			$innerSpan .= Html::element( 'span',
				array( 'class' => 'after-space' ),
				' '
			);
		}

		return Html::rawElement( 'span',
			array( 'class' => isset( $options[ 'class' ] ) ? $options[ 'class' ] : '' ),
			$innerSpan
		);
	}

	private static function playerSecondLine ( $matchType, $vPos, $matchID, $playerInfo ) {
		list( $sourceType, ) = explode( ':', $playerInfo['source'] );
		$playerID = $matchID . ( $vPos == 'top' ? '-1' : '-2' );
		$code = '';

		$innerSpan  = self::parameter( $playerInfo['tag'] . 'score2', '' );

		$code .= Html::rawElement( 'span',
			array( 'class' => 'score2' ),
			$innerSpan
		);

		return self::line( $code,
			array(
				'bm-player-2',
				'bm-code-' . $matchType,
				'source-' . $sourceType,
				$playerInfo['tag'],
				$playerID
			),
			'bm-codeLine-2-' . $playerID
		);
	}

	public static function getRacialDistributionData ( $bracketTemplate ) {
		$data = array();
		$dbr = wfGetDB( DB_SLAVE );
		$row = $dbr->selectRow(
			'bm_brackets',
			array( 'name', 'racialDistribution' ),
			'name = "' . $bracketTemplate . '"',
			__METHOD__
		);
		if ( $row ) {
			$data = $row->racialDistribution;
		}

		return $data;
	}

	public static function searchInDB ( $input ) {
		$data = array();

		$exactMatchCount = 0;
		$lowercaseMatchCount = 0;
		$otherMatchCount = 0;

		$listOutput = '<ul>';
		foreach( $input['names'] as $i => $name ) {
			$players = array();

			if ( $name !== '' ) {
				$dbr = wfGetDB( DB_SLAVE );
				$sql = 'SELECT a.alias, p.name, p.flag, p.race FROM bm_aliases a
					INNER JOIN bm_players p ON p.id = a.pid
					WHERE a.alias LIKE \'' . htmlspecialchars( $name ) . '%\'
					OR a.alias LIKE \'%' . htmlspecialchars( $name ) . '\'
					GROUP BY (p.name COLLATE utf8_bin), p.flag, p.race
					ORDER BY ' .
					$dbr->conditional( "a.alias COLLATE utf8_bin = '" . htmlspecialchars( $name ) . "' ", 4,
						$dbr->conditional( "a.alias = '" . htmlspecialchars( $name ) . "' ", 3,
							$dbr->conditional( "a.alias COLLATE utf8_bin LIKE '%" . htmlspecialchars( $name ) . "' ", 2,
								$dbr->conditional( "a.alias COLLATE utf8_bin LIKE '" . htmlspecialchars( $name ) . "%' ", 1, 0 )
							)
						)
					) .
					'DESC, is_primary_name DESC' .
					' LIMIT 0,7';
				
				$res = $dbr->query( $sql, '__METHOD__' );               
				while ( $row = $dbr->fetchObject( $res ) ) {
					$players[] = $row;
				}
			}

			$listOutput .= '<li>';
			$listOutput .= '<div class="source-name">' . $name . '</div>';
			
			$data[ $i ] = $players;
			
			if ( count( $players ) > 0 ) {
				$listOutput .= Html::input(
					'target-player-enable' . $i,
					'',
					'checkbox',
					array(
						'class' => 'target-player-enable',
						'id' => 'target-player-enable-' . $i,
						'checked' => $input['races'][$i] != 'BYE',
						'disabled' => count( $players ) == 0
					)
				);
			}

			$listOutput .= '<div class="target-players">';
			if ( count( $players ) > 0 ) {
				foreach ( $players as $j => $player ) {
					$listOutput .= '<div class="target-player">';
					$listOutput .= '<span class="bm-flag-edit prev bm-flag-' . $player->flag . '" alt="' . $player->flag . '" title="' . $player->flag . '">' . $player->flag . '</span>';
					$listOutput .= Html::element( 'span',
						array(
							'class' => 'bm-race-edit-prev bm-race-edit-' . $player->race,
							'alt' => $player->race,
							'title' => $player->race 
						),
						$player->race
					);
					$nameClass = 'target-name';
					if ( $player->name == $name ) {
						$nameClass .= ' exact-match';
						if ( $j == 0 )
							$exactMatchCount++;
					} else if ( strtolower( $player->name ) == strtolower( $name ) ) {
						$nameClass .= ' lowercase-match';
						if ( $j == 0 )
							$lowercaseMatchCount++;
					} else {
						$nameClass .= ' other-match';
						if ( $j == 0 )
							$otherMatchCount++;
					}
					$nameHTML = preg_replace( "/($name)/i", '<span class="matching-part">\1</span>', $player->name );
					$nameHTML = '<span class="primary">' . $nameHTML . '</span>';
					if ( $player->alias != $player->name ) {
						$nameHTML .= '<span class="alias">(' . $player->alias . ')</span>';
					}
					$listOutput .= Html::rawElement( 'span',
						array( 'class' => $nameClass ),
						$nameHTML
					);
					$listOutput .= '</div>';
				}
				if ( count( $players ) > 1 ) {
					$listOutput .= '<div class="target-player-select"><a href="javascript:;">' . count( $players ) . ' players</a></div>';
				}   
			} else {
				$listOutput .= '<div class="target-player-none">No player found</div>';
			}
			$listOutput .= '</div>';

			$listOutput .= '</li>';
		}

		$listOutput .= '</ul>';

		return json_encode( array(
			'data' => $data,
			'output' => $listOutput,
			'exactMatchCount' => $exactMatchCount,
			'lowercaseMatchCount' => $lowercaseMatchCount,
			'otherMatchCount' => $otherMatchCount
		) );
	}
}