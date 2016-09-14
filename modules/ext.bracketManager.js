/* global $, jQuery, mediaWiki */
// TODO
// flag = '0'
// race = '0'
// check the good use of 'that'
// alternative to clickoutside?
// BYE -> b
// #R1, #R2... -> #round-R1, #round-R2...
// rename Compute/Propagate Races and Flags
// get rid of loserPos, complementary of winnerPos
// Pink-DK problem with 'Get data from player database'

Array.prototype.remove = function ( value ) {
	return $.grep( this, function ( v ) {
		return v != value;
	});
};

Array.prototype.unique = function () {
	return this.filter( function ( s, i, a ) {
		return i == a.lastIndexOf( s );
	});
};

Array.prototype.diff = function ( a ) {
	return this.filter( function ( i ) {
		return ( a.indexOf( i ) < 0 );
	});
};

( function ( mw, $ ) {
	function BracketManager( ) {
		// Objects
		var that = this,
			data,
			bracket,
			matchDetails,
			code,
			participants,
			racialDistrib,
			rawMatchList;

		this.classes = {};
		this.extendedSeriesPattern = /\{\{(Template:)?[eE](s|xtendedSeries)\|([^\}]?)\}\}/;

		this.autoComputeRacesFlags = false;
		this.thirdPlaceMatch = false;

		// General purpose functions
		function posToMatch ( position ) {
			return position.substring( 0, position.length - 2 );
		}

		function idToPos ( id ) {
			return id.substring( id.lastIndexOf( 'R' ) );
		}

		function idToRound ( id ) {
			return id.substring( id.lastIndexOf( '-' ) + 1 );
		}

		function isEmpty ( array ) {
			return ( array === undefined || array.length === 0 );
		}

		function arrayResize ( input, newSize, padValue ) {
			var pad = [],
				output = [],
				diff = newSize - input.length;

			if ( diff > 0 ) {
				for ( var i = 0; i < diff; i++ ) {
					pad[ i ] = padValue;
				}
				output = input.concat( pad );
			} else if ( diff < 0 ) {
				output = input.slice( 0, newSize );
			} else {
				output = input;
			}

			return output;
		}

		this.init = function () {
			this.initObjects();
			this.cacheElements();
			getBracketDataAndChangeBracket().complete( function () {
				initUI();
				that.bindEvents();
			});
			/*initUI();
			that.bindEvents();
			getBracketDataAndChangeBracket();*/
		};

		this.initObjects = function () {
			data          = new mw.libs.bracketManager.classes.Data();
			bracket       = new mw.libs.bracketManager.classes.Bracket( that, data );
			matchDetails  = new mw.libs.bracketManager.classes.MatchDetails( that, data );
			code          = new mw.libs.bracketManager.classes.Code( that );
			participants  = new mw.libs.bracketManager.classes.Participants( that );
			racialDistrib = new mw.libs.bracketManager.classes.RacialDistribution( that );
			rawMatchList  = new mw.libs.bracketManager.classes.RawMatchList( that, data );

			this.debug = { data: data, bracket: bracket };
		};

		this.cacheElements = function () {
			this.$templateTitle = $( '#bm-template-title' );
			this.$fullManualModeIndicator = $( '#bm-full-manual-mode-indicator' );
			this.$bracketSelect = $( '#bm-bracket-select' );

			// Checkboxes
			this.$propagateRF = $( '#bm-propagateRF' );
			this.$thirdPlaceMatch = $( '#bm-show-third-place-match' );

			// Pushbuttons
			this.$unnamedAndNamedByeToBye = $( '#bm-unnamed-to-bye' );
			this.$byesLose = $( '#bm-byes-lose' );
			this.$searchInDB = $( '#bm-data-from-db' );
			this.$changeBracket = $( '#bm-change-bracket' );

			// Dialogs
			this.$changeBracketDialog = $( '#bm-change-bracket-dialog' );
			this.$dataFromDBDialog = $( '#bm-data-from-db-dialog');

			bracket.cacheElements();
			matchDetails.cacheElements();
			code.cacheElements();
			participants.cacheElements();
			racialDistrib.cacheElements();
			rawMatchList.cacheElements();
		};

		this.bindEvents = function () {
			this.bindCheckBoxEvents();
			this.bindPushButtonEvents();
			this.bindDelegateEvents();

			bracket.bindEvents();
			matchDetails.bindEvents();
			code.bindEvents();
			participants.bindEvents();
			racialDistrib.bindEvents();
			rawMatchList.bindEvents();
		};

		this.bindCheckBoxEvents = function () {
			this.$propagateRF.on( 'change', togglePropagateRF );
			this.$thirdPlaceMatch.on( 'change', toggleThirdPlaceMatch );
		};

		this.bindPushButtonEvents = function () {
			this.$unnamedAndNamedByeToBye.on( 'click', unnamedAndNamedByeToBye );
			this.$byesLose.on( 'click', byesLose );
			this.$searchInDB.on( 'click', searchInDB );
			this.$changeBracket.on( 'click', confirmChangeBracket );
		};

		this.bindDelegateEvents = function () {
			this.$dataFromDBDialog.delegate( '.target-player-select a', 'click', targetPlayerSelectClick );
			this.$dataFromDBDialog.delegate( '.target-player', 'click', targetPlayerClick );
		};

		function togglePropagateRF () {
			that.autoComputeRacesFlags = $(this).is( ':checked' );

			if ( that.autoComputeRacesFlags ) {
				$.each( data.players, function ( i, position ) {
					if ( data.listIndex[ position ] < 0 )
						propagateRFData( position );
				});
			} else {
				$.each( data.players, function ( i, position ) {
					if ( data.listIndex[ position ] < 0 )
						clearPlayerData( position );
				});
			}

			that.updateSelectedMatch();
		}

		function toggleThirdPlaceMatch () {
			var thirdPlaceMatchPosition = idToPos( $( '.bm-match.third-place' ).attr('id') );
			that.thirdPlaceMatch = $(this).is( ':checked' );

			$( '.bm-match.third-place' ).toggle( that.thirdPlaceMatch );
			$( '.bm-hmain .third-place-match-label' ).toggle( that.thirdPlaceMatch );
			code.toggleThirdPlaceMatch( that.thirdPlaceMatch );

			if ( data.selectedMatch == thirdPlaceMatchPosition ) {
				that.resetSelectedMatch();
			}
		}

		// Push button events

		function unnamedAndNamedByeToBye () {
			var i = 0,
				position;
			if ( data.fullManualMode ) {
				for ( ; i < data.players.length; i++ ) {
					position = data.players[i];
					if ( data.playerData.sure.name[ position ] === '' 
					  || data.playerData.sure.name[ position ] === 'bye'
					) {
						setByePos( position );
					}
				}
			} else {
				$.each( data.editableIndex, function ( position, listIndex ) {
					if ( data.playerData.sure.name[ position ] === '' 
					  || data.playerData.sure.name[ position ] === 'bye'
					) {
						setByePos( position );
					}
				});
			}
		}

		function byesLose () {
			var oldByePositions = [],
				byePositions = [],
				i, position,
				match, v, opponentPosition;

			byePositions = getByePositions();

			// While we find new bye positions...
			while ( byePositions.length > 0 ) {
				// We update the score of each match with a bye player
				for ( i = 0; i < byePositions.length; i++ ) {
					position = byePositions[i];
					match = posToMatch( position );
					v = position.charAt( position.length - 1 );
					opponentPosition = match + '-' + ( 3 - v );

					// Score for bye is '-'
					$( '.bracket-score-edit-' + position ).val( '-' );
					// If the opponent is not a bye, then his score is 'W'
					if ( $.inArray( opponentPosition, byePositions ) == -1 ) {
						$( '.bracket-score-edit-' + opponentPosition ).val( 'W' );
					}
					scoreChange( match );
					// If the manual mode is enabled, then
					// we have to set the winner (scoreChange is not enough)
					if ( data.fullManualMode ) {
						// If the opponent is not a bye, then the opponent wins
						if ( $.inArray( opponentPosition, byePositions ) == -1 ) {
							that.setWin( position, false, false );
							that.setWin( opponentPosition, true, false );
						} else {
							// else no winner is decided
							that.setWin( position, false, false );
							that.setWin( opponentPosition, false, false );
						}
					}
				}

				// Recording bye positions...
				$.merge( oldByePositions, byePositions );
				// Getting all the bye positions, including potential new ones...
				byePositions = getByePositions();
				// We just keep the new ones
				byePositions = byePositions.diff( oldByePositions );
			}
		}

		function getByePositions () {
			var byePositions = [];
			$.each( data.playerData.sure.race, function ( position, race ) {
				if ( race == 'BYE' ) {
					byePositions.push( position );
				}
			});
			return byePositions;
		}

		this.roundsInputChange = function () {
			var round = idToRound( $(this).attr( 'id' ) );
			code.setRoundTitle( round, $(this).val() );
		};

		this.loserEditSelectChange = function () {
			var newSource = $(this).val();
			var position  = $(this).attr( 'id' ).substr( 10 );
			that.loserEditChange( position, newSource );
		};

		this.scoreEditChange = function () {
			var thisID = $(this).attr( 'id' );
			var match  = posToMatch( idToPos( thisID ) );
			scoreChange( match );
		};

		function initUI () {
			matchDetails.initUI();
			code.initUI();
			initTabs();
			initChangeBracketDialog();
			initDataFromDBDialog();
		}

		function initTabs () {
			$( '#bm-tabs' ).tabs( {
				selected: 0,
				show: function ( event, ui ) {
					switch ( ui.index ) {
					case 2:
						updateParticipants();
						break;
					case 3:
						updateDistribution();
						break;
					case 4:
						updateRawMatchList();
						break;
					}
				}
			});
		}

		function initChangeBracketDialog () {
			var bmData;
			bmData = mw.config.get( 'wgBracketManagerData' );
			$( '#bm-full-manual-mode-' + ( bmData.fullManualMode ? 'on' : 'off' ) ).attr( 'checked', true );
			//that.$bracketSelect.val(bmDaya);

			that.$changeBracketDialog.dialog( {
				title: 'Change bracket',
				autoOpen: false,
				dialogClass: "ui-change-bracket-dialog",
				minWidth: 500,
				modal: true,
				buttons: {
					'Cancel': function () {
						$(this).dialog( 'close' );
					},
					'OK': function () {
						var bmData;
						$(this).dialog( 'close' );
						//bmData = mw.config.get( 'wgBracketManagerData' );
						bmData = new mw.libs.bracketManager.classes.Data();

						bmData.title = 'Template:' + that.$bracketSelect.val();
						bmData.fullManualMode = $( '#bm-full-manual-mode-on' ).is( ':checked' );

						bmData.hideroundtitles = data.hideroundtitles;
						bmData.roundTitles = $.extend( {}, data.roundTitles );

						bmData.playerData.list.flag = [];
						bmData.playerData.list.race = [];
						bmData.playerData.list.name = [];
						bmData.playerData.computed.flag = {};
						bmData.playerData.computed.race = {};
						bmData.playerData.computed.name = {};

						bmData.playerData.sure.flag = $( '#bm-keep-flags' ).is( ':checked' ) ? $.extend( {}, data.playerData.sure.flag ) : {};
						bmData.playerData.sure.race = $( '#bm-keep-races' ).is( ':checked' ) ? $.extend( {}, data.playerData.sure.race ) : {};
						bmData.playerData.sure.name = $( '#bm-keep-names' ).is( ':checked' ) ? $.extend( {}, data.playerData.sure.name ) : {};

						/*if ( bmData.fullManualMode ) {
							if ( that.$propagateRF.is( ':checked' ) ) {
								bmData.playerData.sure.flag = $( '#bm-keep-flags' ).is( ':checked' ) ? data.playerData.sure.flag : {};
								bmData.playerData.sure.race = $( '#bm-keep-races' ).is( ':checked' ) ? data.playerData.sure.race : {};
							} else {
								bmData.playerData.sure.flag = {};
								bmData.playerData.sure.race = {};
								$.each( data.players, function( i, position ) {
									bmData.playerData.sure.flag[ position ] = $( '#bm-keep-flags' ).is( ':checked' ) && data.listIndex[ position ] != '-1' ? data.playerData.sure.flag[ position ] : '0';
									bmData.playerData.sure.race[ position ] = $( '#bm-keep-races' ).is( ':checked' ) && data.listIndex[ position ] != '-1' ? data.playerData.sure.race[ position ] : '0';
								});
							}
							bmData.playerData.sure.name = {};
							$.each( data.players, function( i, position ) {
								newData.playerData.sure.name[ position ] = $( '#bm-keep-names' ).is( ':checked' ) && data.listIndex[ position ] != '-1' ? data.playerData.sure.name[ position ] : '';
							});
						} else {
							bmData.playerData.list.flag = $( '#bm-keep-flags' ).is( ':checked' ) ? data.playerData.list.flag : [];
							bmData.playerData.list.race = $( '#bm-keep-races' ).is( ':checked' ) ? data.playerData.list.race : [];
							bmData.playerData.list.name = $( '#bm-keep-names' ).is( ':checked' ) ? data.playerData.list.name : [];
						}*/

						bmData.results.score = {};
						bmData.results.score2 = {};
						bmData.isExtendedSeries = {};
						bmData.results.isWinner = {};
						if ( $( '#bm-keep-scores' ).is( ':checked' ) ) {
							bmData.isExtendedSeries = data.isExtendedSeries;
							$.each( data.allMatches, function( i, match ) {
								bmData.results.score[ match + '-1' ] = data.results.score[ match + '-1' ];
								bmData.results.score[ match + '-2' ] = data.results.score[ match + '-2' ];
								if ( bmData.isExtendedSeries[ match ] ) {
									bmData.results.score[ match + '-1' ] = '{{es|' + bmData.results.score[ match + '-1' ] + '}}';
									bmData.results.score[ match + '-2' ] = '{{es|' + bmData.results.score[ match + '-2' ] + '}}';
								}
								bmData.results.score2[ match + '-1' ] = data.results.score2[ match + '-1' ];
								bmData.results.score2[ match + '-2' ] = data.results.score2[ match + '-2' ];
								if ( bmData.isExtendedSeries[ match ] && data.results.score2[ match + '-1' ] !== '' ) {
									bmData.results.score2[ match + '-1' ] = '{{es|' + bmData.results.score2[ match + '-1' ] + '}}';
									bmData.results.score2[ match + '-2' ] = '{{es|' + bmData.results.score2[ match + '-2' ] + '}}';
								}
								bmData.results.isWinner[ match + '-1' ] = data.results.isWinner[ match + '-1' ];
								bmData.results.isWinner[ match + '-2' ] = data.results.isWinner[ match + '-2' ];
							});
						}

						bmData.maps = $( '#bm-keep-match-details' ).is( ':checked' ) ? data.maps : [];
						bmData.matchDetails.date = $( '#bm-keep-match-details' ).is( ':checked' ) ? data.matchDetails.date : [];
						bmData.matchDetails.preview = $( '#bm-keep-match-details' ).is( ':checked' ) ? data.matchDetails.preview : [];
						bmData.matchDetails.lrthread = $( '#bm-keep-match-details' ).is( ':checked' ) ? data.matchDetails.lrthread : [];
						bmData.matchDetails.interview = $( '#bm-keep-match-details' ).is( ':checked' ) ? data.matchDetails.interview : [];
						bmData.matchDetails.recap = $( '#bm-keep-match-details' ).is( ':checked' ) ? data.matchDetails.recap : [];
						bmData.matchDetails.comment = $( '#bm-keep-match-details' ).is( ':checked' ) ? data.matchDetails.comment : [];

						bmData.old = $.extend( {}, data );
						mw.config.set( 'wgBracketManagerData', bmData );

						getBracketDataAndChangeBracket();
					}
				}
			});
		}

		function initDataFromDBDialog () {
			that.$dataFromDBDialog.dialog( {
				title: 'Select players',
				autoOpen: false,
				dialogClass: "ui-data-from-db-dialog",
				minWidth: 500,
				modal: true,
				buttons: {
					'Cancel': function () {
						$(this).dialog( 'close' );
					},
					'OK': function () {
						that.$dataFromDBDialog.find( 'li' ).each( function ( i ) {
							var $selectedPlayerElem = $(this).find( '.target-player:first' ),
								flag, race, name;

							if ( $(this).children( '.target-player-enable' ).is( ':checked' ) && $selectedPlayerElem.length > 0 ) {
								flag = $selectedPlayerElem.find( '.bm-flag-edit' ).attr( 'alt' );
								race = $selectedPlayerElem.find( '.bm-race-edit-prev' ).attr( 'alt' );
								name = $selectedPlayerElem.find( '.target-name .primary' ).text();
								if ( data.fullManualMode ) {
									that.propagateNamePos(data.editableBracketPosition[i], name);
									that.propagateRacePos(data.editableBracketPosition[i], race);
									that.propagateFlagPos(data.editableBracketPosition[i], flag);
								} else {
									that.setPlayerData( i, {
										name: name,
										flag: flag,
										race: race
									});
									that.propagatePlayerData( i, false );
								}
								that.updateSelectedMatch();
							}
						});

						$(this).dialog( 'close' );

						computeRacesAndFlags( data.matchesWithAListMember );
					}
				}
			});
		}

		// getRaceFlagTargets
		// @return the targets for the race and flag propagation for the match.
		function getRaceFlagTargets ( match ) {
			var raceFlagTargets = [];

			raceFlagTargets = raceFlagTargets.concat(
				getRaceFlagTargetsByType( match, 'winner' ),
				getRaceFlagTargetsByType( match, 'loser' )
			);

			return raceFlagTargets;
		}

		function getRaceFlagTargetsByType ( match, type ) {
			var raceFlagTargets = [],
				winnerOrLoserTargets,
				targetPos,
				targetMatch;

			winnerOrLoserTargets = data.flow[ type + 'Targets' ][ match ];

			if ( !isEmpty( winnerOrLoserTargets ) ) {
				targetPos   = winnerOrLoserTargets[0];
				targetMatch = posToMatch( targetPos );

				raceFlagTargets.push( targetPos );
				raceFlagTargets = raceFlagTargets.concat( getRaceFlagTargets( targetMatch ) );
			}

			return raceFlagTargets;
		}

		// computeRacesAndFlags
		// Computes races and flags
		function computeRacesAndFlags ( matches ) {
			var allTargets = [],
				raceFlagTargets,
				closestSourceMatch,
				race1, race2,
				flag1, flag2;

			$.each( matches, function ( i, match ) {
				raceFlagTargets = data.flow.raceFlagTargets[ match ];

				$.each( raceFlagTargets, function ( j, target ) {
					closestSourceMatch = data.flow.sources[ target ][0].match;

					// Race
					race1 = that.getComputedRace( closestSourceMatch + '-' + 1 );
					race2 = that.getComputedRace( closestSourceMatch + '-' + 2 );

					if ( race1 != '0' && race1 == race2 ) {
						setComputedRace( target, race1 );
						data.playerData.sure.race[ target ] = race1;
					} else {
						setComputedRace( target, '0' );
						if ( data.listIndex[ target ] == -1 ) {
							data.playerData.sure.race[ target ] = '0';
						}
					}

					/* FLAG */
					flag1 = that.getComputedFlag( closestSourceMatch + '-' + 1 );
					flag2 = that.getComputedFlag( closestSourceMatch + '-' + 2 );

					if ( flag1 != '0' && flag1 == flag2 ) {
						setComputedFlag( target, flag1 );
						data.playerData.sure.flag[ target ] = flag1;
					} else {
						setComputedFlag( target, '0' );
						if ( data.listIndex[ target ] == -1 ) {
							data.playerData.sure.flag[ target ] = '0';
						}
					}
				});

				allTargets = allTargets.concat( raceFlagTargets );
			});

			allTargets = allTargets.unique();

			if ( that.autoComputeRacesFlags ) {
				$.each( allTargets, function ( i, target ) {
					propagateRFData( target );
				});
			}
		}

		this.getComputedFlag = function ( bracketPosition ) {
			var flag = data.playerData.sure.flag[ bracketPosition ];
			if ( flag === '0' || !flag || flag === undefined ) {
				flag = data.playerData.computed.flag[ bracketPosition ];
			}
			return flag;
		};

		function setComputedFlag ( position, flag ) {
			data.playerData.computed.flag[ position ] = flag;
		}

		this.getFlag = function ( bracketPosition ) {
			if ( this.autoComputeRacesFlags ) {
				return that.getComputedFlag( bracketPosition );
			} else {
				if ( data.listIndex[ bracketPosition ] < 0 && !data.fullManualMode ) {
					return '0';
				} else {
					return data.playerData.sure.flag[ bracketPosition ];
				}
			}
		};

		this.getComputedRace = function ( bracketPosition ) {
			var race = data.playerData.sure.race[ bracketPosition ];
			if ( race === '0' || !race || race === undefined ) {
				race = data.playerData.computed.race[ bracketPosition ];
			}
			return race;
		};

		function setComputedRace ( position, race ) {
			data.playerData.computed.race[ position ] = race;
		}

		this.getRace = function ( bracketPosition ) {
			if ( this.autoComputeRacesFlags ) {
				return that.getComputedRace( bracketPosition );
			} else {
				if ( data.listIndex[ bracketPosition ] < 0 && !data.fullManualMode ) {
					return '0';
				} else {
					return data.playerData.sure.race[ bracketPosition ];
				}
			}
		};

		function cutDependencies ( type, match ) {
			var targets = data.flow[ type + 'Targets' ][ match ],
				targetSources,
				found,
				newSource,
				tmpType, tmpMatch;

			if ( targets !== undefined ) {
				$.each( targets, function ( i, target ) {
					targetSources = data.flow.sources[ target ];

					if ( targetSources !== undefined ) {
						found = false;
						for ( var j = targetSources.length - 1; j >= 0; j-- ) {
							tmpType  = targetSources[j].type;
							tmpMatch = targetSources[j].match;

							if ( found ) {
								data.flow[ tmpType + 'Targets' ][ tmpMatch ] =
									data.flow[ tmpType + 'Targets' ][ tmpMatch ].remove( target );
								targetSources.splice( j, 1 );
							}
							if ( !found && ( tmpType == type && tmpMatch == match ) ) {
								found = true;
							}
						}
						// The new source of the target is targetSources[0].
						tmpType  = targetSources[0].type;
						tmpMatch = targetSources[0].match;
						if ( data.results[ tmpType + 'Pos' ][ tmpMatch ] != 0 ) {
							newSource = tmpMatch + '-' + data.results[ tmpType + 'Pos' ][ tmpMatch ];
							setListIndex( target, data.listIndex[ newSource ] );
						} else {
							setListIndex( target, -1 );
						}
					}
				});
			}
		}

		function propagateDependencies ( type, match, playerPos ) {
			var bracketPosition = match + '-' + playerPos,
				sources = data.flow.sources[ bracketPosition ],
				targets = data.flow[ type + 'Targets' ][ match ],
				listIndex;

			if ( targets !== undefined ) {
				$.each( targets, function ( i, target ) {
					if ( sources !== undefined ) {
						data.flow.sources[ target ] = sources.concat( data.flow.sources[ target ] );
					}
					setListIndex( target, data.listIndex[ bracketPosition ]);
				});
				if ( sources !== undefined ) {
					$.each( sources, function ( i, source ) {
						data.flow[ source.type + 'Targets' ][ source.match ] =
							data.flow[ source.type + 'Targets' ][ source.match ].concat( targets );
					});
				}
			}

			listIndex = data.listIndex[ bracketPosition ];
			if ( listIndex !== undefined && listIndex != -1 ) {
				that.propagatePlayerData( listIndex, false );
			}
		}

		this.propagatePlayerData = function ( listIndex, doComputeRacesAndFlags ) {
			if ( listIndex === undefined || listIndex == -1 )
				return false;

			this.propagateFlag( listIndex );
			this.propagateRace( listIndex );
			if ( doComputeRacesAndFlags ) {
				this.computeRacesAndFlagsForListIndex( listIndex );
			}
			this.propagateName( listIndex );

			return true;
		};

		this.computeRacesAndFlagsForListIndex = function ( listIndex ) {
			if ( data.bracketPositions[ listIndex ] !== undefined ) {
				// TODO: unique map?
				computeRacesAndFlags(
						$.map( data.bracketPositions[ listIndex ], posToMatch )
					);
			}
		};

		this.propagateFlag = function ( listIndex ) {
			var position = data.bracketPositions[listIndex][0],
				flag = data.playerData.sure.flag[ position ];

			bracket.setPropertyLI( listIndex, 'flag', flag );

			if ( data.bracketPositions[ listIndex ] !== undefined ) {
				$.each( data.bracketPositions[ listIndex ], function ( i, position ) {
					that.propagateFlagPos( position, flag );
				});
			}
		};

		this.propagateFlagPos = function ( position, flag ) {
			if ( flag === '' )
				flag = '0';
			var flagText = ( flag != '0' ? flag : '' );

			data.playerData.sure.flag[ position ] = flag;
			bracket.setFlag( position, flag );
			code.setFlag( position, flagText );
		};

		this.propagateRace = function ( listIndex ) {
			var position = data.bracketPositions[listIndex][0],
				race = data.playerData.sure.race[ position ];

			bracket.setPropertyLI( listIndex, 'race', race );

			if ( data.bracketPositions[ listIndex ] !== undefined ) {
				$.each( data.bracketPositions[ listIndex ], function ( i, position ) {
					that.propagateRacePos( position, race );
				});
			}
		};

		this.propagateRacePos = function ( position, race ) {
			if ( $.inArray( race, [ 'p', 't', 'z', 'r', 'BYE', '0' ] ) == -1 ) {
				race = '0';
			}
			var raceText = ( race != '0' ? race : '' );

			data.playerData.sure.race[ position ] = race;
			bracket.setRace( position, race );
			code.setRace( position, raceText );
		};

		this.propagateName = function ( listIndex ) {
			var position = data.bracketPositions[listIndex][0],
				name = data.playerData.sure.name[ position ];

			bracket.setPropertyLI( listIndex, 'name', name );

			if ( data.bracketPositions[ listIndex ] !== undefined ) {
				$.each( data.bracketPositions[ listIndex ], function ( i, position ) {
					that.propagateNamePos( position, name );
				});
			}
		};

		this.propagateNamePos = function ( position, name ) {
			data.playerData.sure.name[ position ] = name;
			bracket.setName( position, name );
			code.setName( position,
				name,
				data.results.isWinner[ position ] && !data.results.invisibleWinner[ position ]
			);
		};

		// TODO: comment this gibberish code :P
		// TODO: implement or remove the 'list' part of this function
		function changeSource ( position, newSource ) {
			var match = posToMatch( position ),
				oldSources, oldSource;

			// Memorizing old sources
			oldSources = data.flow.sources[ position ];

			// Cutting dependencies
			$.each( [ 'winner', 'loser' ], function ( i, type ) {
				cutDependencies( type, match );
			});

			if ( newSource != 'none' )
				bracket.addSource( position, newSource );
			if ( /*newSource == 'list' ||*/ newSource == 'none' )
				bracket.removeSource( position, 'loser' );

			switch ( newSource ) {
			case 'none':
				if ( oldSources.length > 0 ) {
					oldSource = oldSources[ oldSources.length - 1 ];
					data.flow.sources[ position ] = [];
					data.flow[ oldSource.type + 'Targets' ][ oldSource.match ] = [];
				}
				setListIndex( position, -1 );
				break;
			/*case 'list':
				break;*/
			default:
				/*bracket.removeSource( position, 'list' );*/
				cutDependencies( 'loser', newSource );
				data.flow.loserTargets[ newSource ] = [ position ];
				data.flow.sources[ position ] = [ { type: 'loser', match: newSource } ];
				if ( data.results.loserPos[ newSource ] > 0 ) {
					propagateDependencies( 'loser', newSource, data.results.loserPos[ newSource ] );
				}
			}

			if ( data.results.winnerPos[ match ] > 0 ) {
				$.each( [ 'winner', 'loser' ], function ( i, type ) {
					var pos = data.results[ type + 'Pos' ][ match ];
					propagateDependencies( type, match, pos );
				});
			}
		}

		this.loserEditChange = function ( position, newSource ) {
			var oldSource       = 'none',
				mirrorPosition  = null,
				matchesToUpdate = [];

			if ( newSource != 'list' && newSource != 'none' &&
				data.flow.loserTargets[ newSource ].length > 0 ) {
				mirrorPosition = data.flow.loserTargets[ newSource ][ 0 ];
				if ( data.flow.sources[ position ].length > 0 ) {
					oldSource = data.flow.sources[ position ][ data.flow.sources[ position ].length - 1 ].match;
				}
				matchesToUpdate.push( newSource );
			}

			matchesToUpdate.push( posToMatch( position ) );
			changeSource( position, newSource );

			if( mirrorPosition !== null ) {
				bracket.setLoserEditSource( mirrorPosition, oldSource );

				if ( oldSource != 'list' && oldSource != 'none' ) {
					matchesToUpdate.push( oldSource );
				}

				matchesToUpdate.push( posToMatch( mirrorPosition ) );
				changeSource ( mirrorPosition, oldSource );
			}

			$.each( data.allMatches, function ( i, match ) {
				data.flow.raceFlagTargets[ match ] = getRaceFlagTargets( match );
			});
			computeRacesAndFlags( matchesToUpdate );
		};

		function initEvents () {
			// * Round titles
			$( '.bm-round-title-edit' ).each( function () {
				var round = idToRound( $(this).attr( 'id' ) );
				code.setRoundDefaultTitle( round, $(this).val() );
			});

			if( $( '#bm-seed-editor-mode' ).is( ':checked' ) ) {
				$( '#bm-seed-editor-mode' ).click();
			}
			if( $( '#bm-match-details-mode' ).is( ':checked' ) ) {
				$( '#bm-match-details-mode' ).click();
			}
			$( '.bm-match-overlay' ).hide();
			$( '.bm-match-id' ).hide();
			$( '.bm-match-move' ).hide();
			$( '.bm-match-loserEdit-seed' ).hide();
			$( '.bm-match-loserEdit-target' ).hide();
			$( '.bm-match-loserEdit-info' ).hide();
			$( '#bm-match-details' ).hide();
		}

		function setListIndex ( bracketPosition, listIndex ) {
			var currentListIndex = data.listIndex[ bracketPosition ];

			if ( currentListIndex != -1 ) {
				data.bracketPositions[ currentListIndex ] =
					data.bracketPositions[ currentListIndex ].remove( bracketPosition );
			}
			if ( listIndex !== undefined ) {
				data.listIndex[ bracketPosition ] = listIndex;
				bracket.setListIndex( bracketPosition, listIndex );
				if ( listIndex != -1 ) {
					data.bracketPositions[ listIndex ].push( bracketPosition );
				} else {
					clearPlayerData( bracketPosition );
				}
			}
		}

		this.setPropertyLI = function ( listIndex, property, value ) {
			var position = data.bracketPositions[listIndex][0];
			data.playerData.sure[ property ][ position ] = value;
			data.playerData.list[ property ][ listIndex ] = value;
		};

		function setBye ( index ) {
			that.setPlayerData( index, {
				race: 'BYE',
				name: 'BYE'
			});
			that.propagatePlayerData( index, true );
		}

		function setByePos ( position ) {
			that.propagateNamePos( position, 'BYE' );
			that.propagateRacePos( position, 'BYE' );
		}

		// TODO: rename
		function propagateRFData ( bracketPosition ) {
			var flag, flagText,
				race, raceText;

			// Flag
			flag = that.getComputedFlag( bracketPosition );
			flagText = flag != '0' ? flag : '';
			data.playerData.sure.flag[ bracketPosition ] = flag;
			bracket.setFlag( bracketPosition, flag );
			code.setFlag( bracketPosition, flagText );

			// Race
			race = that.getComputedRace( bracketPosition );
			raceText = race != '0' ? race : '';
			data.playerData.sure.race[ bracketPosition ] = race;
			bracket.setRace( bracketPosition, race );
			code.setRace( bracketPosition, raceText );
		}

		function clearPlayerData ( bracketPosition ) {
			// Flag
			data.playerData.sure.flag[ bracketPosition ] = '0';
			bracket.setFlag( bracketPosition, '0' );
			code.setFlag( bracketPosition, '' );

			// Race
			data.playerData.sure.race[ bracketPosition ] = '0';
			bracket.setRace( bracketPosition, '0' );
			code.setRace( bracketPosition, '' );

			// Name
			data.playerData.sure.name[ bracketPosition ] = '';
			bracket.setName( bracketPosition, '' );
			code.setName( bracketPosition, '', false );
		}

		function scoreChange ( match ) {
			var results;

			retrieveAndPropagateScores( match );
			if ( data.fullManualMode )
				return;

			results = determineWinnerOfMatch( match );
			setWinner( match, results.winner, results.invisibleWinner );
		}

		function retrieveAndPropagateScores ( match ) {
			var p1score = 0, p2score = 0,
				p1score2 = 0, p2score2 = 0,
				position1 = match + '-1', position2 = match + '-2';

			// Retrieve scores of this match
			p1score = $( '#bm-score-edit-' + match + '-1' ).val();
			p2score = $( '#bm-score-edit-' + match + '-2' ).val();

			// Store scores
			data.results.score[ position1 ] = p1score;
			data.results.score[ position2 ] = p2score;

			// Propagate scores in code
			code.setScore( position1, p1score );
			code.setScore( position2, p2score );

			// Second series
			if ( $( '#bm-match-' + match ).is( '.two-series-match' ) ) {
				// Retrieve second scores of this match
				p1score = $( '#bm-score-2-edit-' + position1 ).val();
				p2score = $( '#bm-score-2-edit-' + position2 ).val();

				// Store second scores
				data.results.score2[ position1 ] = p1score2;
				data.results.score2[ position2 ] = p2score2;

				// Propagate second scores in code
				code.setScore2( position1, p1score2 );
				code.setScore2( position2, p2score2 );
			}
		}

		function determineWinnerOfMatch ( match ) {
			var p1score = 0, p2score = 0,
				p1score2 = 0, p2score2 = 0,
				position1 = match + '-1', position2 = match + '-2',
				secondSeries, results = {},
				race1, race2;

			p1score = data.results.score[ position1 ];
			p2score = data.results.score[ position2 ];
			p1score2 = data.results.score2[ position1 ];
			p2score2 = data.results.score2[ position2 ];
			secondSeries = ( p1score2 !== undefined && p1score2 !== '' ) || ( p2score2 !== undefined && p2score2 !== '' );
			race1 = data.playerData.sure.race[ match + '-1' ];
			race2 = data.playerData.sure.race[ match + '-2' ];

			// Determine the winner / loser
			if ( race1 == 'BYE' && race2 == 'BYE' && p1score == '-' && p2score == '-' ) {
				results.winner = 1;
				results.invisibleWinner = true;
			} else {
				results.winner = secondSeries ? determineWinnerOfSeries( p1score2, p2score2 ) :
					determineWinnerOfSeries( p1score, p2score );
				results.invisibleWinner = false;
			}

			return results;
		}

		function determineWinnerOfSeries ( p1score, p2score ) {
			var winner,
				p1scoreInt, p2scoreInt;

			p1scoreInt = parseInt( p1score, 10 );
			p2scoreInt = parseInt( p2score, 10 );
			if ( p1scoreInt > 0 && ( p2score === '' || p2score == '-' ) ) {
				winner = 1;
			} else if ( p2scoreInt > 0 && ( p1score === '' || p1score == '-' ) ) {
				winner = 2;
			} else if ( ( p1score == 'W' || p2score == 'W' ) && p1score != p2score ) {
				winner = p1score == 'W' ? 1 : 2;
			} else if ( ( p1score == '{{win}}' || p2score == '{{win}}' ) && p1score != p2score ) {
				winner = p1score == '{{win}}' ? 1 : 2;
			} else if ( p1scoreInt > p2scoreInt ) {
				winner = 1;
			} else if ( p1scoreInt < p2scoreInt ) {
				winner = 2;
			} else
				winner = 0;

			return winner;
		}

		function setWinner ( match, winner, invisibleWinner ) {
			var loser,
				winnerLoserLossOrChange,
				matchWinnerPosition,
				noWinnerBefore;

			// Detect loss or change of winner / loser
			winnerLoserLossOrChange = ( winner != data.results.winnerPos[ match ] );

			// Reset data
			bracket.bold( match + '-1', false );
			bracket.bold( match + '-2', false );
			code.setWin( match + '-1', false );
			code.setWin( match + '-2', false );
			data.results.isWinner[ match + '-1' ] = false;
			data.results.isWinner[ match + '-2' ] = false;
			data.results.invisibleWinner[ match + '-1' ] = false;
			data.results.invisibleWinner[ match + '-2' ] = false;

			// If a winner has been decided
			if ( winner > 0 ) {
				loser = 3 - winner;
				matchWinnerPosition = match + '-' + winner;
				that.setWin( matchWinnerPosition, true, invisibleWinner );
			} else {
				loser = 0;
			}

			if ( !winnerLoserLossOrChange ) {
				return false;
			}

			// true if there was no winner before
			noWinnerBefore = ( data.results.winnerPos[ match ] == 0 );

			// Store winner / loser (0, 1 or 2)
			data.results.winnerPos[ match ] = winner;
			data.results.loserPos[ match ] = loser;

			// If there is no winner (ergo no loser),
			// or if there is a winner and there was also a winner before
			// (which is not the same because winnerLoserLossOrChange is true),
			// then we cut the dependencies from our result
			if ( winner == 0 || !noWinnerBefore ) {
				$.each( [ 'winner', 'loser' ], function ( i, type ) {
					cutDependencies( type, match );
				});
			}
			// If a winner is decided, we propagate the dependencies from our result
			if ( winner > 0 ) {
				propagateDependencies( 'winner', match, winner );
				propagateDependencies( 'loser', match, loser );
			}
			computeRacesAndFlags( [ match ] );
		}

		this.toggleWin = function ( position ) {
			if ( data.fullManualMode ) {
				this.setWin( position, !data.results.isWinner[ position ], false );
			}
		};

		this.setWin = function ( position, win, invisibleWinner ) {
			bracket.bold( position, win && !invisibleWinner );
			code.setWin( position, win && !invisibleWinner );
			data.results.isWinner[ position ] = win;
			data.results.invisibleWinner[ position ] = invisibleWinner;
		};

		this.setPlayerData = function ( listIndex, data ) {
			for ( var property in data ) {
				this.setPropertyLI( listIndex, property, data[property] );
			}
		};

		this.swapPlayers = function ( sourcePos, targetPos ) {
			var sourceFlag = data.playerData.sure.flag[ sourcePos ],
				sourceRace = data.playerData.sure.race[ sourcePos ],
				sourceName = data.playerData.sure.name[ sourcePos ],
				sourceListIndex = data.listIndex[ sourcePos ],
				targetFlag = data.playerData.sure.flag[ targetPos ],
				targetRace = data.playerData.sure.race[ targetPos ],
				targetName = data.playerData.sure.name[ targetPos ],
				targetListIndex = data.listIndex[ targetPos ];

			this.setPlayerData( targetListIndex, { 
				flag: sourceFlag,
				race: sourceRace,
				name: sourceName
			});
			this.setPlayerData( sourceListIndex, { 
				flag: targetFlag,
				race: targetRace,
				name: targetName
			});

			this.propagatePlayerData( sourceListIndex, true );
			this.propagatePlayerData( targetListIndex, true );
		};

		this.updateSelectedMatch = function ( selectedMatch ) {
			if ( selectedMatch !== undefined )
				data.selectedMatch = selectedMatch;

			bracket.updateSelectedOverlay( data.selectedMatch );
			matchDetails.updateSelectedMatch( data.selectedMatch );
		};

		this.resetSelectedMatch = function () {
			this.updateSelectedMatch( data.allMatches[0] );
		};

		this.setExtendedSeries = function ( match, isExtendedSeries ) {
			data.isExtendedSeries[ match ] = isExtendedSeries;
			bracket.setExtendedSeries( match, isExtendedSeries );
			code.setExtendedSeries( match, isExtendedSeries );
		};

		this.setMapEnabled = function ( match, mapNumber, enabled ) {
			data.maps[ match ][ mapNumber - 1 ].enabled = enabled;
			code.toggleMap( match, mapNumber, enabled );
			if ( match == data.selectedMatch ) {
				matchDetails.setMapEnabled( mapNumber, enabled );
			}
		};

		this.setMap = function ( match, mapNumber, map ) {
			data.maps[ match ][ mapNumber - 1 ].map = map;
			code.setMap( match, mapNumber, map );
			if ( match == data.selectedMatch ) {
				matchDetails.setMap( mapNumber, map );
			}
		};

		this.setMapwin = function ( match, mapNumber, mapwin ) {
			data.maps[ match ][ mapNumber - 1 ].mapwin = mapwin;
			code.setMapwin( match, mapNumber, mapwin );
			if ( match == data.selectedMatch ) {
				matchDetails.setMapwin( mapNumber, mapwin );
			}
		};

		this.setVodgame = function ( match, mapNumber, vodgame ) {
			data.maps[ match ][ mapNumber - 1 ].vodgame = vodgame;
			code.setVodgame( match, mapNumber, vodgame );
			if ( match == data.selectedMatch ) {
				matchDetails.setVodgame( mapNumber, vodgame );
			}
		};

		this.setDate = function ( match, date ) {
			data.matchDetails.date[ match ] = date;
			code.setDate( match, date );
			if ( match == data.selectedMatch ) {
				matchDetails.setDate( date );
			}
		};

		this.setPreview = function ( match, preview ) {
			data.matchDetails.preview[ match ] = preview;
			code.setPreview( match, preview );
			if ( match == data.selectedMatch ) {
				matchDetails.setPreview( preview );
			}
		};

		this.setLRThread = function ( match, lrthread ) {
			data.matchDetails.lrthread[ match ] = lrthread;
			code.setLRThread( match, lrthread );
			if ( match == data.selectedMatch ) {
				matchDetails.setLRThread( lrthread );
			}
		};

		this.setInterview = function ( match, interview ) {
			data.matchDetails.interview[ match ] = interview;
			code.setInterview( match, interview );
			if ( match == data.selectedMatch ) {
				matchDetails.setInterview( interview );
			}
		};

		this.setRecap = function ( match, recap ) {
			data.matchDetails.recap[ match ] = recap;
			code.setRecap( match, recap );
			if ( match == data.selectedMatch ) {
				matchDetails.setRecap( recap );
			}
		};

		this.setComment = function ( match, comment ) {
			data.matchDetails.comment[ match ] = comment;
			code.setComment( match, comment );
			if ( match == data.selectedMatch ) {
				matchDetails.setComment( comment );
			}
		};

		function confirmChangeBracket () {
			that.$changeBracketDialog.dialog( 'open' );
		}

		// Change bracket
		function getBracketDataAndChangeBracket () {
			bracket.loading( true );

			return $.getJSON(
				mw.util.wikiScript(),
				{
					format: 'json',
					action: 'ajax',
					rs: 'BracketManagerFunctions::updateBracket',
					rsargs: [ that.$bracketSelect.val() ]
				},
				changeBracket
			).complete(	getCodeDataAndUpdateCode );
		}

		function changeBracket ( jsonData ) {
			var listIndex, editableIndex, scoreIndex;

			data.playerData.computed.flag = {};
			data.playerData.computed.race = {};
			data.results.isWinner = {};
			data.results.invisibleWinner = {};

			retrieveDataFromJSON( jsonData.architecture );
			retrieveDataFromGlobalVariable( jsonData.numPlayers );
			if (data.forceListAsDataSource) {
				data.playerData.sure.flag = {};
				data.playerData.sure.race = {};
				data.playerData.sure.name = {};				
			} else {
				data.playerData.list.flag = [];
				data.playerData.list.race = [];
				data.playerData.list.name = [];
			}
			updateOptions( jsonData.templateTitle );
			setBracketHTMLCode( jsonData.html );

			// Assigning the list indexes to the player divs of the Bracket
			// listIndex = -1 for player who are not members of the source list
			data.listIndex = bracket.getListIndexObject();
			data.bracketPositions = bracket.getBracketPositionsArray();

			bracket.propagateListIndexes();
			bracket.hideFlagAndRaceHelpers();
			that.autoComputeRacesFlags = that.$propagateRF.is( ':checked' );
			bracket.applyUserOptions( jsonData.thirdPlaceMatchAvailable );

			// Make matches draggable and droppable
			bracket.initMatchMoveUI();

			// Assigning the tabIndexes
			var tabIndex;
			$( '.bm-round-title-edit' ).each( function ( index ) {
				tabIndex = index + 1;
				$(this).attr( 'tabindex', tabIndex );
			});
			$.each( jsonData.matchCycle, function ( index, id ) {
				$( '#bm-match-' + id ).find( '.bm-score-edit:not(.bm-score-2-edit)' ).attr( 'tabindex', ++tabIndex );
				$( '#bm-match-' + id ).find( '.bm-score-2-edit' ).attr( 'tabindex', ++tabIndex );
			});

			//bracket.addEditableClass();
			data.editableIndex = {};
			data.editableBracketPosition = [];
			editableIndex = 0;
			data.scoreIndex = {};
			data.scoreBracketPosition = [];
			scoreIndex = 0;
			$.each( jsonData.matchCycle, function ( i, id ) {
				var player1Position = id + '-1',
					player2Position = id + '-2';
				if ( data.fullManualMode || $( '#' + player1Position ).is( '.bm-match-source-list' ) ) {
					data.editableIndex[ player1Position ] = editableIndex;
					data.editableBracketPosition[ editableIndex++ ] = player1Position;
				}
				if ( data.fullManualMode || $( '#' + player2Position ).is( '.bm-match-source-list' ) ) {
					data.editableIndex[ player2Position ] = editableIndex;
					data.editableBracketPosition[ editableIndex++ ] = player2Position;
				}
				data.scoreIndex[ player1Position ] = scoreIndex;
				data.scoreBracketPosition[ scoreIndex++ ] = player1Position;
				data.scoreIndex[ player2Position ] = scoreIndex;
				data.scoreBracketPosition[ scoreIndex++ ] = player2Position;
			});

			// Race and flags propagation - targets
			data.flow.raceFlagTargets = {};
			data.players = [];
			$.each( data.allMatches , function ( i, match ) {
				data.flow.raceFlagTargets[ match ] = getRaceFlagTargets( match );
				data.players.push( match + '-1', match + '-2' );
			});

			// Initialisation of the bracket races, flags and names,
			// and editableIndex, isWinner and invisibleWinner data.
			editableIndex = 0;
			$.each( data.players, function ( i, position ) {
				data.playerData.computed.flag[ position ] = '0';
				data.playerData.computed.race[ position ] = '0';
				data.results.invisibleWinner[ position ] = false;
				listIndex = data.listIndex[ position ];

				if (!(position in data.playerData.sure.flag)) {
					data.playerData.sure.flag[ position ] = '0';
					data.playerData.sure.race[ position ] = '0';
					data.playerData.sure.name[ position ] = '';
				}

				if ( !data.fullManualMode ) {
					// winner is determined later in scoreChange
					data.results.isWinner[ position ] = false;
					if (listIndex >= 0) {
						if (data.forceListAsDataSource) {
							data.playerData.sure.flag[ position ] = data.playerData.list.flag[ listIndex ];
							data.playerData.sure.race[ position ] = data.playerData.list.race[ listIndex ];
							data.playerData.sure.name[ position ] = data.playerData.list.name[ listIndex ];
						} else {
							data.playerData.list.flag[ listIndex ] = data.playerData.sure.flag[ position ];
							data.playerData.list.race[ listIndex ] = data.playerData.sure.race[ position ];
							data.playerData.list.name[ listIndex ] = data.playerData.sure.name[ position ];
						}
						data.editableIndex[ position ] = editableIndex;
						data.editableBracketPosition[ editableIndex++ ] = position;
					}
				}
				bracket.setEditable(position, (data.fullManualMode || listIndex >= 0));
			});
			// The sure data may contain too much information, from different brackets. Let's get rid of it.
			$.each(data.playerData.sure.flag, function ( position ) {
				if (data.players.indexOf(position) === -1) {
					delete data.playerData.sure.flag[position];
					delete data.playerData.sure.race[position];
					delete data.playerData.sure.name[position];
				}
			});

			if ( !data.fullManualMode ) {
				// Propagate races, flags and names
				$.each( data.playerData.list.name, function ( listIndex, name ) {
					that.propagatePlayerData( listIndex, true );
				});
				computeRacesAndFlags( data.matchesWithAListMember );
			} else {
				$.each( data.players, function ( i, position ) {
					bracket.setFlag( position, data.playerData.sure.flag[ position ] );
					bracket.setRace( position, data.playerData.sure.race[ position ] );
					bracket.setName( position, data.playerData.sure.name[ position ] );
					bracket.bold( position, data.results.isWinner[ position ] );
				});
			}

			if ( !data.fullManualMode ) {
				$.each( data.allMatches, function ( index, match ) {
					var esRegMatch1 = that.extendedSeriesPattern.exec( data.results.score[ match + '-1' ] ),
						esRegMatch2 = that.extendedSeriesPattern.exec( data.results.score[ match + '-2' ] );

					if ( esRegMatch1 === null && esRegMatch2 === null ) {
						data.isExtendedSeries[ match ] = data.isExtendedSeries[ match ] !== undefined ? data.isExtendedSeries[ match ] : false;
					} else {
						data.isExtendedSeries[ match ] = true;
						data.results.score[ match + '-1' ] = esRegMatch1 !== null ? esRegMatch1[3] : data.results.score[ match + '-1' ];
						data.results.score[ match + '-2' ] = esRegMatch2 !== null ? esRegMatch2[3] : data.results.score[ match + '-2' ];
					}
				});
			} else {
				$.each( data.allMatches, function ( index, match ) {
					data.isExtendedSeries[ match ] = false;
				});
			}
			$.each( data.isExtendedSeries, function ( match, isExtendedSeries ) {
				bracket.setExtendedSeries( match, isExtendedSeries );
			});

			// Set scores
			$.each( data.results.score, function ( position, score ) {
				bracket.setScore( position, score );
			});
			$.each( data.results.score2, function ( position, score ) {
				bracket.setScore2( position, score );
			});

			$.each( data.flow.loserTargets, function ( source, targets ) {

			});

			// Propagate scores and compute results
			$.each( data.allMatches, function ( i, match ) {
				scoreChange( match );
			});

			$.each( data.allMatches, function ( i, match ) {
				if ( data.maps[ match ] === undefined ) {
					data.maps[ match ] = [];
				}
				for ( var j = 0; j < 9; j++ ) {
					if ( data.maps[ match ][j] === undefined ) {
						data.maps[ match ][j] = {
							enabled: false,
							map: '',
							mapwin: '',
							vodgame: ''
						};
					}
				}
			});

			// Round titles
			$( '.bm-round-title-edit' ).each( function () {
				var round = idToRound( $(this).attr( 'id' ) );
				code.setRoundDefaultTitle( round, $(this).val() );
				if (!(round in data.roundTitles)) {
					data.roundTitles[round] = null;
				}
			});
			$.each( data.roundTitles, function ( round, roundTitle ) {
				if ( roundTitle !== null ) {
					bracket.setRoundTitle( round, roundTitle );
				}
			});

			// Selected match
			data.selectedMatch = data.allMatches[0];

			// Reset "force list as data source"
			data.forceListAsDataSource = false;

			initEvents();

			bracket.loading( false );
		}

		function updateOptions ( templateTitle ) {
			updateTemplateTitle( templateTitle );
			updateFullManualModeIndicator();
			updatePropagateRFCheckbox();
		}

		function updateTemplateTitle ( templateTitle ) {
			that.$templateTitle.text( templateTitle );
			data.templateTitle = templateTitle;
		}

		function updateFullManualModeIndicator () {
			that.$fullManualModeIndicator.toggle( data.fullManualMode );
		}

		function updatePropagateRFCheckbox () {
			that.$propagateRF.attr( 'disabled', data.fullManualMode );
			if ( data.fullManualMode )
				that.$propagateRF.attr( 'checked', false );
		}

		function retrieveDataFromJSON ( architecture ) {
			data.flow.winnerTargets = architecture.winnerTargets;
			data.flow.loserTargets = architecture.loserTargets;
			data.flow.sources = architecture.sources;
			data.results.winnerPos = architecture.winnerPos;
			data.results.loserPos = architecture.loserPos;
			data.allMatches = architecture.allMatches;
			data.matchesWithAListMember = architecture.matchesWithAListMember;
		}

		function retrieveDataFromGlobalVariable ( numPlayers ) {
			var bmData = mw.config.get( 'wgBracketManagerData' );
			console.log('forceListAsDataSource', bmData.forceListAsDataSource);

			data.hideroundtitles = bmData.hideroundtitles;
			data.roundTitles = bmData.roundTitles;
			data.forceListAsDataSource = bmData.forceListAsDataSource;
			if (bmData.forceListAsDataSource) {
				data.playerData.list.flag = arrayResize( bmData.playerData.list.flag, numPlayers, '0' );
				data.playerData.list.race = arrayResize( bmData.playerData.list.race, numPlayers, '0' );
				data.playerData.list.name = arrayResize( bmData.playerData.list.name, numPlayers, '' );
			}
			data.fullManualMode = bmData.fullManualMode;
			if ( data.fullManualMode ) {
				data.results.isWinner = bmData.results.isWinner;
			}
			data.playerData.sure.flag = bmData.playerData.sure.flag;
			data.playerData.sure.race = bmData.playerData.sure.race;
			data.playerData.sure.name = bmData.playerData.sure.name;
			data.results.score = bmData.results.score;
			data.results.score2 = bmData.results.score2;
			data.isExtendedSeries = bmData.isExtendedSeries;
			data.maps = bmData.maps;
			data.matchDetails.date = bmData.matchDetails.date;
			data.matchDetails.preview = bmData.matchDetails.preview;
			data.matchDetails.lrthread = bmData.matchDetails.lrthread;
			data.matchDetails.interview = bmData.matchDetails.interview;
			data.matchDetails.recap = bmData.matchDetails.recap;
			data.matchDetails.comment = bmData.matchDetails.comment;
		}

		function setBracketHTMLCode( code ) {
			bracket.html( code );
		}

		function getCodeDataAndUpdateCode () {
			// TODO loading...

			return $.getJSON(
				mw.util.wikiScript(),
				{
					format: 'json',
					action: 'ajax',
					rs: 'BracketManagerFunctions::updateCode',
					rsargs: [ that.$bracketSelect.val() ]
				},
				updateCode
			);
		}

		function updateCode ( jsonData ) {
			code.html( jsonData.code );

			$( '#bm-bracket-code .bm-player' ).each( function () {
				var bracketPos = idToPos( $(this).attr( 'id' ) ),
					isWinner  = data.results.isWinner[ bracketPos ],
					invisibleWinner = data.results.invisibleWinner[ bracketPos ],
					flag, race, name, score, score2, win;

				if ( that.autoComputeRacesFlags ) {
					flag = that.getComputedFlag( bracketPos );
					race = that.getComputedRace( bracketPos );
				} else {
					flag = data.playerData.sure.flag[ bracketPos ];
					race = data.playerData.sure.race[ bracketPos ];
				}
				if ( flag == '0' )
					flag = '';
				if ( race == '0' )
					race = '';

				name = data.playerData.sure.name[ bracketPos ];
				score = data.results.score[ bracketPos ];
				score2 = data.results.score2[ bracketPos ];
				win = data.results.isWinner[ bracketPos ];

				code.setFlag( bracketPos, flag );
				code.setRace( bracketPos, race );
				code.setName( bracketPos, name, isWinner && !invisibleWinner );
				code.setScore( bracketPos, score );
				code.setScore2( bracketPos, score2 );
				code.setWin( bracketPos, win );
			});

			$.each( data.isExtendedSeries, function ( match, isExtendedSeries ) {
				code.setExtendedSeries( match, isExtendedSeries );
			});

			$.each( data.allMatches, function ( i, match ) {
				for ( var j = 0; j < 9; j++ ) {
					code.toggleMap( match, j + 1, data.maps[ match ][j].enabled );
					code.setMap( match, j + 1, data.maps[ match ][j].map );
					code.setMapwin( match, j + 1, data.maps[ match ][j].mapwin );
					code.setVodgame( match, j + 1, data.maps[ match ][j].vodgame );
				}
				code.setDate( match, data.matchDetails.date[match] );
				code.setPreview( match, data.matchDetails.preview[match] );
				code.setLRThread( match, data.matchDetails.lrthread[match] );
				code.setInterview( match, data.matchDetails.interview[match] );
				code.setRecap( match, data.matchDetails.recap[match] );
				code.setComment( match, data.matchDetails.comment[match] );
			});

			$.each( data.roundTitles, function ( round, roundTitle ) {
				code.setRoundTitle( round, roundTitle );
			});
			//code.setHideroundtitles( data.hideroundtitles );

			code.applyUserOptions();
		}

		function updateParticipants () {
			var players = { 'p': [], 't': [], 'z': [], 'r': [] };

			// Storing players in a table
			$.each( data.playerData.list.race, function ( listIndex, race ) {
				var flag     = data.playerData.list.flag[ listIndex ],
					flagText = ( flag != '0' ? flag : '' ),
					name     = data.playerData.list.name[ listIndex ];

				if ( $.inArray( race, ['p', 't', 'z', 'r'] ) != -1 ) {
					players[ race ].push( [ flagText, name ] );
				}
			});

			participants.updateParticipantsCode( players );
		}

		function updateDistribution () {
			// TODO LOADING...

			$.getJSON(
				mw.util.wikiScript('api'),
				{
					format: 'json',
					action: 'bracketmanager',
					op: 'racialdistribution',
					bracket: that.$bracketSelect.val()
				},
				function ( jsonData ) {
					var racialDistributionData = jsonData.bracketmanager.racialdistribution,
						winnerPos;

					if ( racialDistributionData === undefined || racialDistributionData === null ) {
						racialDistrib.noRacialDistributionCode();
						return;
					}

					winnerPos = data.results.winnerPos[ racialDistributionData.winnerDecidingMatch ];
					racialDistrib.updateRacialDistributionCode( racialDistributionData, winnerPos );
				}
			);
		}

		function updateRawMatchList () {
			rawMatchList.updateRawMatchListCode();
		}

		function searchInDB () {
			var races = $.map(data.editableIndex, function(k, v){return data.playerData.sure.race[v];}),
				names = $.map(data.editableIndex, function(k, v){return data.playerData.sure.name[v];});

			$.getJSON(
				mediaWiki.util.wikiScript(),
				{
					format: 'json',
					action: 'ajax',
					rs: 'BracketManagerFunctions::searchInDB',
					rsargs: [ { races: races, names: names } ]
				},
				function ( jsonData ) {
					that.$dataFromDBDialog.find( '.intro .exact-match-count' ).text( jsonData.exactMatchCount );
					that.$dataFromDBDialog.find( '.intro .lowercase-match-count' ).text( jsonData.lowercaseMatchCount );
					that.$dataFromDBDialog.find( '.intro .other-match-count' ).text( jsonData.otherMatchCount );
					that.$dataFromDBDialog.find( '.content' ).html( jsonData.output );
					that.$dataFromDBDialog.dialog( 'open' );
				}
			);
		}

		function targetPlayerClick () {
			var $targetPlayersElem = $(this).parent(),
				$liElem = $targetPlayersElem.parent();
			$(this).detach();
			$(this).prependTo( $targetPlayersElem );
			that.$dataFromDBDialog.find( 'li' ).not( $liElem ).removeClass( 'active' );
			$liElem.toggleClass( 'active' );
		}

		function targetPlayerSelectClick () {
			$(this).parent().parent().parent().toggleClass( 'active' );
		}
	}

	mw.libs.bracketManager = new BracketManager();

} ) ( mediaWiki, jQuery );