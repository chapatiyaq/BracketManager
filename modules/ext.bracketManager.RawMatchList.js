( function ( mw, $ ) {
	function RawMatchList ( bm, data ) {
		var rawMatchList = this;
		var cf = new mw.libs.bracketManager.classes.CodeFunctions();

		var replacements = {
			1: 'player1',
			2: 'player2',
			n: 'winnerNumber',
			w: 'winnerName',
			l: 'loserName',
			m: 'map'
		}

		this.cacheElements = function () {
			this.$code = $( '#bm-raw-match-list' );
			this.$errorLog = $( '#bm-raw-match-list-error-log' );
			this.$selectAll = $( '#bm-raw-match-list-select-all' );
			this.$format = $( '#bm-raw-match-list-options input.format' );
		};

		this.bindEvents = function () {
			this.$code.delegate( 'textarea', 'blur', this.textareaBlur );
			this.$selectAll.on( 'click', this.selectAll );
		};

		this.selectAll = function () {
			var textarea = document.createElement( 'textarea' ),
				$textarea,
				lineTexts = rawMatchList.$code.children( ':visible' ).map( function () { return $(this).text(); } ),
				text = $.makeArray( lineTexts ).join( '\r' );

			rawMatchList.$code.append( textarea );
			$textarea = rawMatchList.$code.find( 'textarea' );
			$textarea.attr( 'readonly', true );
			$textarea.text( text );
			$textarea.focus().select();
		};

		this.textareaBlur = function () {
			rawMatchList.$code.find( 'textarea' ).remove();
		};

		this.updateRawMatchListCode = function () {
			var outputObject = { output: '', errorLog: '' };

			$.each( data.allMatches, function ( i, match ) {
				var player1Position = match + '-1',
					player2Position = match + '-2',
					p1score = data.results.score[ player1Position ],
					p2score = data.results.score[ player2Position ],
					p1score2 = data.results.score2[ player1Position ],
					p2score2 = data.results.score2[ player2Position ],
					matchData = {};

				matchData.player1 = data.playerData.sure.name[ player1Position ];
				matchData.player2 = data.playerData.sure.name[ player2Position ];
				matchData.maps = data.maps[match];

				if ( p1score !== undefined && p2score !== undefined ) {
					matchData.p1score = p1score;
					matchData.p2score = p2score;
					createMatchLines( matchData, outputObject );
				}
				if ( p1score2 !== undefined && p2score2 !== undefined ) {
					matchData.p1score2 = p1score2;
					matchData.p2score2 = p2score2;
					createMatchLines( matchData, outputObject );					
				}
			});

			if ( outputObject.output === '' ) {
				outputObject.output = 'No match result.';
			}
			if ( outputObject.errorLog === '' ) {
				outputObject.errorLog = 'No error detected.';
			}

			rawMatchList.$code.html( outputObject.output );
			rawMatchList.$errorLog.html( outputObject.errorLog );
		};

		function createMatchLines ( matchData, outputObject ) {
			var p1scoreInt = parseInt( matchData.p1score, 10 ),
				p2scoreInt = parseInt( matchData.p2score, 10 ),
				i, j,
				min, max,
				winner = 0,
				remainingWins1, remainingWins2,
				lineData = {};

			lineData.player1 = matchData.player1;
			lineData.player2 = matchData.player2;

			if ( p1scoreInt >= 0 && p2scoreInt >= 0 ) {
				min = Math.min( p1scoreInt, p2scoreInt );
				max = Math.max( p1scoreInt, p2scoreInt );
				winner = p1scoreInt >= p2scoreInt ? 1 : 2;
				remainingWins1 = p1scoreInt;
				remainingWins2 = p2scoreInt;

				i = 0;
				while ( matchData.maps[i].enabled ) {
					lineData.winnerNumber = matchData.maps[i].mapwin;
					lineData.map = matchData.maps[i].map !== '' ? matchData.maps[i].map : 'Unknown';
					outputObject.output += createGameCodeLine( lineData );

					if ( matchData.maps[i].mapwin == 1 )
						remainingWins1--;
					else if ( matchData.maps[i].mapwin == 2 )
						remainingWins2--;
					i++;
				}

				lineData.map = 'Unknown';
				if ( remainingWins1 > 0 || remainingWins2 > 0 ) {
					while ( remainingWins1 > remainingWins2 ) {
						lineData.winnerNumber = 1;
						outputObject.output += createGameCodeLine( lineData );
						
						remainingWins1--;
					}
					while ( remainingWins2 > remainingWins1 ) {
						lineData.winnerNumber = 2;
						outputObject.output += createGameCodeLine( lineData );
						
						remainingWins2--;
					}
					for ( i = 0; i < remainingWins1; i++ ) {
						lineData.winnerNumber = 3 - winner;
						outputObject.output += createGameCodeLine( lineData );
						
						lineData.winnerNumber = winner;
						outputObject.output += createGameCodeLine( lineData );
					}
				} 
				if ( remainingWins1 < 0 || remainingWins2 < 0 ) {
					outputObject.errorLog += createErrorLine( matchData.player1, matchData.player2, 'The number of map wins (from Match details) is greater than the score for one or both of the players.');
				}
			}
		}

		function createGameCodeLine ( lineData ) {
			var format = rawMatchList.$format.val();
				output = '';
			
			for ( var i = 0; i < format.length; i++ ) {
				if ( format.charAt(i) == '\\' ) {
					i++;
					switch ( format.charAt(i) ) {
					case '1':
						output += formatPlayerName( lineData.player1 );
						break;
					case '2':
						output += formatPlayerName( lineData.player2 );
						break;
					case 'n':
						output += lineData.winnerNumber;
						break;
					case 'w':
						if ( lineData.winnerNumber == 1 ) {
							output += formatPlayerName( lineData.player1 );
						} else if ( lineData.winnerNumber == 2 ) {
							output += formatPlayerName( lineData.player2 );							
						}
						break;
					case 'l':
						if ( lineData.winnerNumber == 1 ) {
							output += formatPlayerName( lineData.player2 );
						} else if ( lineData.winnerNumber == 2 ) {
							output += formatPlayerName( lineData.player1 );							
						}
						break;
					case 'm':
						output += lineData.map;
						break;
					case 't':
						output += '\t';
						break;
					case '\\':
						output += '\\';
					}
				} else {
					output += format.charAt(i);
				}
			}

			return cf.codeLine( output );
		}

		function formatPlayerName( playerName ) {
			return playerName != '' ? playerName : 'TBD';
		}

		function createErrorLine ( player1, player2, errorMsg ) {
			return cf.codeLine( player1 + ' vs. ' + player2 + ': ' + errorMsg );
		}
	}

	mw.libs.bracketManager.classes.RawMatchList = RawMatchList;
}) ( mediaWiki, jQuery );