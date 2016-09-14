<?php
class BracketManagerParser {
	private $playerDataParams;
	private $playerResultParams;
	private $matchDetailsParams;
	public $bracketId;

	const NO_PARSER = 1;
	const NODE_COUNT_LIMIT_EXCEEDED = 2;
	const NO_TEMPLATE_FOUND = 3;

	public function __construct() {
		$this->playerDataParams = array( 'name', 'flag', 'race' );
		$this->playerResultParams = array( 'score', 'score2', 'isWinner' );
		$this->matchDetailsParams = array( 'date', 'preview', 'lrthread', 'interview', 'recap', 'comment' ); 
	}

	private function getBracketDataObject() {
		$data = new BracketData();
		foreach( $this->playerDataParams as $paramName ) {
			$data->playerData['list'][ $paramName ] = array();
			$data->playerData['sure'][ $paramName ] = array();
		}
		foreach( $this->playerResultParams as $paramName ) {
			$data->results[ $paramName ] = array();
		}
		foreach( $this->matchDetailsParams as $paramName ) {
			$data->matchDetails[ $paramName ] = array();
		}
		return $data;
	}

	public function getDataForCreate( $bracketId, $players ) {
		$listNames = preg_split( "/(\r\n|\n|,)/", $players );
		$countPlayers = count( $listNames );

		$data = $this->getBracketDataObject();

		$bracketNumPlayers = self::getBracketNumPlayers();
		if ( $bracketId != 0 ) {
			$data->bracketId = $bracketId;
		} else {
			// Get the smallest bracket who can contain all the listed players
			$data->bracketId = '2SEBracket';
			$tmpCount = 0;
			foreach( $bracketNumPlayers as $id => $numPlayers ) {
				if ( $numPlayers >= $countPlayers ) {
					$data->bracketId = $id;
					break;
				} elseif ( $numPlayers > $tmpCount ) {
					$tmpCount = $numPlayers;
					// If no bracket is big enough to contain all the players, at least let's get the closest one.
					$data->bracketId = $id;
				}
			}
		}

		$data->playerData['list']['name'] = array_pad( $listNames, $bracketNumPlayers[ $data->bracketId ], '' );
		$data->playerData['list']['flag'] = array_fill( 0, $bracketNumPlayers[ $data->bracketId ], '' );
		$data->playerData['list']['race'] = array_fill( 0, $bracketNumPlayers[ $data->bracketId ], '' );
		$data->fullManualMode = false;
		$data->forceListAsDataSource = true;

		return $data;
	}

	function getBracketNumPlayers() {
		$bracketNumPlayers = array();
		$dbr = wfGetDB( DB_SLAVE );
		$res = $dbr->select(
			'bm_brackets',
			array( 'name', 'numberOfPlayers' ),
			'',
			__METHOD__,
			array( 'ORDER BY' => 'id ASC' )
		);
		while ( $row = $dbr->fetchObject( $res ) ) {
			$bracketNumPlayers[ $row->name ] = $row->numberOfPlayers;
		}
		$dbr->freeResult( $res );

		return $bracketNumPlayers;
	}

	public function getDataForParse( $wikitext ) {
		global $wgParser;
		$otherFields = array( 'date', 'preview', 'lrthread', 'interview', 'recap', 'comment' );

		$data = self::getBracketDataObject();

		$title_obj = Title::newFromText( 'Special:BracketManager' );
		$options = new ParserOptions();
		$wgParser->startExternalParse( $title_obj, $options, OT_PREPROCESS );
		$dom = $wgParser->preprocessToDom( $wikitext );
		if ( is_callable( array( $dom, 'saveXML' ) ) ) {
			$xml = $dom->saveXML();
		} else {
			$xml = $dom->__toString();
		}

		$templateData = self::findTemplate( $dom->node, $wgParser );

		if ( ! is_array( $templateData ) ) {
			$data->bracketId = '2SEBracket';
		} else {
			$brackets = array();

			$dbr = wfGetDB( DB_SLAVE );
			$row = $dbr->selectRow(
				'bm_brackets',
				array( 'listNameParameters', 'bracketPositionToParameter' ),
				array( 'name' => $templateData['title'] ),
				__METHOD__,
				array( 'ORDER BY' => 'id ASC' )
			);
			if ( $row ) {
				$listNameParameters = json_decode( $row->listNameParameters );
				$bracketPositionToParameter = json_decode( $row->bracketPositionToParameter );

				$data->bracketId = $templateData['title'];
				$params = $templateData['params'];

				// List players
				foreach( $listNameParameters as $base ) {
					foreach( $this->playerDataParams as $paramName ) {
						$data->playerData['list'][ $paramName ][] = self::getPlayerData( $paramName, $params, $base );
					}
				}

				// Pre-processing for position-to-tag conversion
				$nameParameters = array();
				foreach( $bracketPositionToParameter as $position => $base ) {
					$nameParameters[$position] = $base;
				}

				foreach( $nameParameters as $position => $base ) {
					foreach( $this->playerDataParams as $paramName ) {						
						$data->playerData['sure'][ $paramName ][ $position ] = $this->getPlayerData( $paramName, $params, $base );
					}
					foreach( $this->playerResultParams as $paramName ) {
						$data->results[ $paramName ][ $position ] = $this->getPlayerData( $paramName, $params, $base );
					}
				}

				$dirArchitectures = dirname(__FILE__) . '/modules/bracketArchitectures/';
				$bracketInfo = json_decode(
					file_get_contents( $dirArchitectures. 'ext.bracketManager.' . $templateData['title'] . '.json' ),
					true
				);

				//echo '<pre>' . print_r( $bracketInfo, true ) . '</pre>';
				/*$loserEditTargets = array();
				foreach ( $bracketInfo['matches'] as $match => $matchProperties ) {
					self::addTargets( $match . '-1', $matchProperties['player1'], $loserEditTargets );
					self::addTargets( $match . '-2', $matchProperties['player2'], $loserEditTargets );
				}
				if ( count( $loserEditTargets ) ) {
					foreach( $loserEditTargets as $loserEditScope ) {
						foreach ( $loserEditScope as $source => $target ) {
							echo $this->data['name'][];
						}
					}
				}*/

				foreach( array_keys( $bracketInfo[ 'matches' ] ) as $match ) {
					$data->maps->{ $match } = array();
					
					if ( isset( $params[ $match .  'details' ] )
					  && $params[ $match . 'details' ][ 'title' ] == 'BracketMatchSummary'
					  && count( $params[ $match . 'details' ][ 'params' ] ) > 0 ) {
						$matchSummary = $params[ $match . 'details' ]['params'];
						for ( $i = 1; $i <= 9; $i++ ) {
							$data->maps->{ $match }[ $i-1 ] = array(
								'enabled' => isset( $matchSummary[ "map$i" ] ),
								'map' => isset( $matchSummary[ "map$i" ] ) ? $matchSummary[ "map$i" ] : '',
								'mapwin' => isset( $matchSummary[ "map{$i}win" ] ) ? $matchSummary[ "map{$i}win" ] : '',
								'vodgame' => isset( $matchSummary[ "vodgame$i" ] ) ? $matchSummary[ "vodgame$i" ] : ''
							);
						}
						foreach ( $this->matchDetailsParams as $paramName ) {
							$data->matchDetails[ $paramName ][ $match ] = isset( $matchSummary[ $paramName ] ) ? $matchSummary[ $paramName ] : '';
						}
					} else {
						foreach ( $this->matchDetailsParams as $paramName ) {
							$data->matchDetails[ $paramName ][ $match ] = '';
						}
					}
				}

				$data->hideroundtitles = self::getBracketDatum( 'hideroundtitles', $params );

				foreach( array_keys( $bracketInfo[ 'roundTitles' ] ) as $round ) {
					$data->roundTitles->$round = self::getBracketDatum( $round, $params );
				}
			} else {
				$data->bracketId = '2SEBracket';
			}
		}

		$data->fullManualMode = true;
		$data->forceListAsDataSource = false;

		return $data;
	}

	private function getPlayerData( $paramName, $params, $base ) {
		switch( $paramName ) {
		case 'name':
			$name = isset( $params[ $base ] ) ? $params[ $base ] : '';
			return str_replace( '\'\'\'', '', $name );
		case 'flag':
			$flag = isset( $params[ "{$base}flag" ] ) ? $params[ "{$base}flag" ] : '';
			return strtolower( $flag );
			//return str_replace( $this->iso3166CodesSearch, $this->iso3166CodesReplace, strtolower( $flag ) );
		case 'race':
			$race = isset( $params[ "{$base}race" ] ) ? $params[ "{$base}race" ] : '';
			return $race == 'bye' ? 'BYE' : $race;
		case 'score':
			$score = isset( $params[ "{$base}score" ] ) ? $params[ "{$base}score" ] : '';
			return self::pullScoreFrom( $score );
		case 'score2':
			$score2 = isset( $params[ "{$base}score2" ] ) ? $params[ "{$base}score2" ] : '';
			return self::pullScoreFrom( $score2 );
		case 'isWinner':
			$win = isset( $params[ "{$base}win" ] ) ? $params[ "{$base}win" ] : '';
			return $win !== '';
		}
	}

	function pullScoreFrom( $scoreParamValue ) {
		if ( is_array( $scoreParamValue ) && self::isExtendedSeriesTemplate( $scoreParamValue ) ) {
			return self::getScoreFromExtendedSeriesTemplate( $scoreParamValue );
		} else {
			return $scoreParamValue;
		}
	}

	function isExtendedSeriesTemplate( $array ) {
		return preg_match( "/(Template:)?[eE](s|xtendedSeries)/", $array['title'] );
	}

	function getScoreFromExtendedSeriesTemplate( $array ) {
		return isset($array['params']) && isset($array['params']['']) ? '{{es|' . $array['params'][''] . '}}' : '';
	}

	private function getBracketDatum( $paramName, $params ) {
		switch( $paramName ) {
		case 'hideroundtitles':
			$value = isset( $params[ $paramName ] ) ? $params[ $paramName ] == 'true' : false;
			return $value;
		default:
			$value = isset( $params[ $paramName ] ) ? $params[ $paramName ] : null;
			return $value;
		}
	}

	/*function addTargets ( $playerPos, $playerProperties, &$targets ) {
		if ( isset( $playerProperties['loserEditScope'] ) ) {
			if ( !isset( $targets[ $playerProperties['loserEditScope'] ] ) )
				$targets[ $playerProperties['loserEditScope'] ] = array();
			list(, $source) = explode( ':', $playerProperties['source'] );
			$targets[ $playerProperties['loserEditScope'] ][ $source ] = $playerPos;
		}
	}*/

	function findTemplate( $root, $parser = null ) {
		global $wgParser;
		static $expansionDepth = 0;
		$flags = 0;

		if ( $parser == null ) {
			return self::NO_PARSER;
		}
		if ( ++$parser->mPPNodeCount > $parser->mOptions->getMaxPPNodeCount() ) {
			return self::NODE_COUNT_LIMIT_EXCEEDED;
		}

		$frame = $parser->getPreprocessor()->newFrame();

		/*if ( $root instanceof PPNode_DOM ) {
			$root = $root->node;
		}
		if ( $root instanceof DOMDocument ) {
			$root = $root->documentElement;
		}*/

		$xpath = new DOMXPath( $root->ownerDocument );
		$templates = $xpath->query( 'template', $root );
		if ( $templates->length > 0 ) {
			foreach( $templates as $templateNode ) {
				$xpath = new DOMXPath( $templateNode->ownerDocument );
				$titles = $xpath->query( 'title', $templateNode );
				$title = $titles->item( 0 );
				$parts = $xpath->query( 'part', $templateNode );

				$title = $frame->expand( $title, PPFrame::NO_TEMPLATES );
				$title = trim( $title );

				$params = array();
				if ( $parts->length > 0 ) {
					foreach( $parts as $partNode ) {
						$names = $xpath->query( 'name', $partNode );
						$name = $names->item( 0 );
						$values = $xpath->query( 'value', $partNode );
						$value = $values->item( 0 );

						$nameText = trim( $frame->expand( $name, PPFrame::NO_TEMPLATES ) );
						$valueText = trim( $frame->expand( $value, PPFrame::NO_TEMPLATES ) );

						// Looking for BracketMatchSummary
						$subTemplatesData = self::parseTemplate( $value, $xpath, $frame );
						if ( count( $subTemplatesData ) > 0 ) {
							$params[$nameText] = $subTemplatesData[0];
						} else {
							if ( ! isset( $params[$nameText] ) ) {
								$params[$nameText] = $valueText;
							}
						}
					}
				}
			}
			return array( 'title' => $title, 'params' => $params );
		} else {
			// No template
			return self::NO_TEMPLATE_FOUND;
		}
	}

	function parseTemplate( $domNode, $xpath, $frame ) {

		$templatesData = array();

		$templates = $xpath->query( 'template', $domNode );
		if ( $templates->length > 0 ) {
			foreach( $templates as $templateNode ) {
				$xpath = new DOMXPath( $templateNode->ownerDocument );
				$titles = $xpath->query( 'title', $templateNode );
				$title = $titles->item( 0 );
				$parts = $xpath->query( 'part', $templateNode );

				$title = $frame->expand( $title, PPFrame::NO_TEMPLATES );
				$title = trim( $title );

				$params = array();
				if ( $parts->length > 0 ) {
					foreach( $parts as $partNode ) {
						$names = $xpath->query( 'name', $partNode );
						$name = $names->item( 0 );
						$values = $xpath->query( 'value', $partNode );
						$value = $values->item( 0 );

						$nameText = trim( $frame->expand( $name, PPFrame::NO_TEMPLATES ) );
						$valueText = trim( $frame->expand( $value, PPFrame::NO_TEMPLATES ) );

						if ( ! isset( $params[$nameText] ) ) {
							$params[$nameText] = $valueText;
						}
					}
				}

				$templatesData[] = array( 'title' => $title, 'params' => $params );
			}
		}

		return $templatesData;
	}
}

class BracketData {
	public $title;
	public $playerData;
	public $results;
	public $matchDetails;
	public $isExtendedSeries;
	public $maps;
	public $columnWidth;
	public $hideroundtitles;
	public $roundTitles;
	public $fullManualMode;
	public $forceListAsDataSource;
	public $bracketId;

	public function __construct() {
		$this->title = '';
		$this->playerData = array(
			'list' => array(),
			'sure' => array(),
			'computed' => array()
		);
		$this->results = array();
		$this->matchDetails = array();
		$this->isExtendedSeries = new stdClass();
		$this->maps = new stdClass();
		$this->columnWidths = array();
		$this->hideroundtitles = false;
		$this->roundTitles = new stdClass();
		$this->fullManualMode = false;
		$this->forceListAsDataSource = false;
	}
}