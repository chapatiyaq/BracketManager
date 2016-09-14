( function ( mw, $ ) {
	function Participants ( bm ) {
		var participants = this;
		var cf = new mw.libs.bracketManager.classes.CodeFunctions();

		this.cacheElements = function () {
			this.$code = $( '#bm-list-of-participants' );
			this.$selectAll = $( '#bm-participants-select-all' );
		};

		this.bindEvents = function () {
			this.$code.delegate( 'textarea', 'blur', this.textareaBlur );
			this.$selectAll.on( 'click', this.selectAll );
		};

		this.selectAll = function () {
			var textarea = document.createElement( 'textarea' ),
				$textarea,
				lineTexts = participants.$code.children( ':visible' ).map( function () { return $(this).text(); } ),
				text = $.makeArray( lineTexts ).join( '\r' );

			participants.$code.append( textarea );
			$textarea = participants.$code.find( 'textarea' );
			$textarea.attr( 'readonly', true );
			$textarea.text( text );
			$textarea.focus().select();
		};

		this.textareaBlur = function () {
			participants.$code.find( 'textarea' ).remove();
		};

		this.updateParticipantsCode = function ( players ) {
			var s, output,
				maxLength,
				races = ['p','t','z'];

			if ( players.r.length > 0 )
				races.push( 'r' );

			// Opening the table
			output = cf.codeLine( cf.tableBrackets( 'open' ) + ' ' +
				cf.parameterHeadAndValue( 'class', '"wikitable participantstable"')
			);

			// Header row
			raceHeaders = [ ['p', 'Protoss'], ['t', 'Terran'], ['z', 'Zerg'] ];
			if ( players.r.length > 0 )
				raceHeaders.push( [ 'r', 'Random' ] );
			$.each( raceHeaders, function ( i, race ) {
				s = cf.tableCell( { 'style': new mw.html.Raw( '"background-color:' + cf.template( 'RaceColor', { '@1': race[0] } )
							+ ';text-align:center;'
							+ '"' )
					},
					mw.html.escape( '\'\'\'' ) + cf.template( race[0] ) +
					mw.html.escape( ' ' + race[1] + ' \'\'(' + players[race[0]].length + ')\'\'\'\'\'' )
				);
				output += cf.codeLine( s );
			} );

			// Player rows
			maxLength = Math.max( 
				players.p.length, players.t.length,
				players.z.length, players.r.length
			);
			for ( var i = 0; i < maxLength; i++ ) {
				output += cf.codeLine( '|-' );
				$.each( races, function ( j, race ) {
					s = cf.tableDelimiter();
					if ( i < players[race].length ) {
						s += cf.template( 'player',
							{ 'flag': players[race][i][0], '@1': players[race][i][1] }
						);
					}
					output += cf.codeLine( s );
				} );
			}

			// Closing the table
			output += cf.codeLine( cf.tableBrackets( 'close' ) );

			participants.$code.html( output );
		};
	}

	mw.libs.bracketManager.classes.Participants = Participants;
}) ( mediaWiki, jQuery );