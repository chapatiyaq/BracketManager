( function ( mw, $ ) {
	function RacialDistribution ( bm ) {
		var distribution = this;
		var cf = new mw.libs.bracketManager.classes.CodeFunctions();

		this.cacheElements = function () {
			this.$code = $( '#bm-racial-distribution' );
			this.$selectAll = $( '#bm-distribution-select-all' );
		};

		this.bindEvents = function () {
			this.$code.delegate( 'textarea', 'blur', this.textareaBlur );
			this.$selectAll.on( 'click', this.selectAll );
		};

		this.selectAll = function () {
			var textarea = document.createElement( 'textarea' ),
				$textarea,
				lineTexts = distribution.$code.children( ':visible' ).map( function () { return $(this).text(); } ),
				text = $.makeArray( lineTexts ).join( '\r' );

			distribution.$code.append( textarea );
			$textarea = distribution.$code.find( 'textarea' );
			$textarea.attr( 'readonly', true );
			$textarea.text( text );
			$textarea.focus().select();
		};

		this.textareaBlur = function () {
			distribution.$code.find( 'textarea' ).remove();
		};

		function createRaceDistLine ( title, playerNumberByRace, first, last ) {
			var v,
				params = { title: title },
				races = { protoss: 'p', terran: 't', zerg: 'z' };
			if ( playerNumberByRace.r > 0 )
				races.random = 'r';
			races.nyd = 'nyd';

			for ( var race in races ) {
				v = races[race];
				params[race] = playerNumberByRace[v];
			}

			if ( first ) {
				params.first = 1;
			}
			if ( last ) {
				params.last = 1;
			}

			return cf.template( 'RaceDist', params );
		}

		function getRaceForDistribution ( bracketPosition ) {
			var race = bm.getComputedRace( bracketPosition );
			if ( race === undefined || race == 'BYE' || race == '0' || race === '' ) {
				race = 'nyd';
			}
			return race;
		}

		this.noRacialDistributionCode = function () {
			var output = 'Not available for this bracket template.';
			distribution.$code.html( output );
		};

		this.updateRacialDistributionCode = function ( data, winnerPos ) {
			var output = '',
				playerNumberByRace,
				winnerRace, 
				race1, race2;

			$.each( data.lines, function ( i, item ) { 
				playerNumberByRace = { p: 0, t: 0, z: 0, r: 0, nyd: 0 };

				$.each( item.players, function ( j, bracketPosition ) {
					playerNumberByRace[ getRaceForDistribution( bracketPosition ) ]++;
				} );

				output += cf.codeLine( createRaceDistLine( 
					item.title,
					playerNumberByRace,
					i === 0,
					false ) );
			} );

			// "Winner" line
			playerNumberByRace = { p: 0, t: 0, z: 0, r: 0, nyd: 0 };
			if ( winnerPos > 0 ) {
				winnerRace = getRaceForDistribution( data.winnerDecidingMatch + '-' + winnerPos );
			} else {
				race1 = getRaceForDistribution( data.winnerDecidingMatch + '-1' );
				race1 = getRaceForDistribution( data.winnerDecidingMatch + '-2' );
				if ( race1 == race2 && race1 != '0' ) {
					winnerRace = race1;
				} else {
					winnerRace = 'nyd';
				}
			}
			playerNumberByRace[ winnerRace ]++;
			output += cf.codeLine( createRaceDistLine( 'Winner', playerNumberByRace, false, true ) );

			distribution.$code.html( output );
		};
	}

	mw.libs.bracketManager.classes.RacialDistribution = RacialDistribution;
}) ( mediaWiki, jQuery );