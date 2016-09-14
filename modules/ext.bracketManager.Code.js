( function ( mw, $ ) {
	function Code ( bm ) {
		var code = this;
		var defaultRoundTitles = [];
		var otherFields = [ 'date', 'preview', 'lrthread', 'interview', 'recap', 'comment' ];

		this.cacheElements = function () {
			this.$options = $( '#bm-code-options' );
			this.$showRaceCode = $( '#bm-show-race-code' );
			this.$showFlagCode = $( '#bm-show-flag-code' );
			this.$showWinCode = $( '#bm-show-win-code' );
			this.$hideRoundTitles = $( '#bm-hide-round-titles' );
			this.$playerCellWidth = $( '#bm-player-cell-width' );
			this.$scoreCellWidth = $( '#bm-score-cell-width' );
			this.$playerCellWidthValue = $( '#bm-player-cell-width-value' );
			this.$scoreCellWidthValue = $( '#bm-score-cell-width-value' );
			this.$showMatchDetails = $( '#bm-show-match-details' );
			this.$playerFields = $( '#bm-code-player-fields' );
			this.$boldWinnersNames = $( '#bm-bold-winners-names' );
			this.$code = $( '#bm-bracket-code' );
			this.$selectAll = $( '#bm-code-select-all' );
			this.$otherFieldsParameters = {};
			$.each( otherFields, function ( i, field ) {
				code.$otherFieldsParameters[ field ] = $( '#bm-code-options .other-fields-parameters .display-' + field );
			});
		};

		this.initUI = function () {
			initCodeOptionsAccordion();
			initCodeOptionsPlayerFieldsSortable
		};

		this.bindEvents = function () {
			this.$showRaceCode.on( 'click', toggleRaceCode );
			this.$showFlagCode.on( 'click', toggleFlagCode );
			this.$showWinCode.on( 'click', toggleWinCode );
			this.$hideRoundTitles.on( 'click', toggleHideRoundTitles );
			this.$playerCellWidth.on( 'click', togglePlayerCellWidth );
			this.$scoreCellWidth.on( 'click', toggleScoreCellWidth );
			this.$playerCellWidthValue.on( 'change', playerCellWidthValueChange );
			this.$scoreCellWidthValue.on( 'change', scoreCellWidthValueChange );
			this.$showMatchDetails.on( 'change', toggleMatchDetails );
			this.$boldWinnersNames.on( 'change', toggleBoldWinnersNames );
			this.$code.delegate( 'textarea', 'blur', this.textareaBlur );
			this.$selectAll.on( 'click', this.selectAll );
			$.each( otherFields, function ( i, field ) {
				code.$otherFieldsParameters[ field ].delegate(
					'input[type="radio"]',
					'change',
					toggleOtherField
				);
			});
		};
		
		function initCodeOptionsAccordion () {
			// Code
			code.$options.accordion( {
				active: false,
				collapsible: true
			});
		}

		function initCodeOptionsPlayerFieldsSortable () {
			code.$playerFields.sortable( {
				item:             'li',
				placeholder:      'ui-state-highlight',
				axis:             'x',
				forcePlaceholderSize: true
			});
			code.$playerFields.on( {
				sortstart: optionsPlayerFieldsSortStart,
				sortupdate: optionsPlayerFieldsSortUpdate
			});
		}

		function toggleRaceCode () {
			$( '.bm-codeLine .race' ).toggle( $(this).is( ':checked' ) );
		}

		function toggleFlagCode () {
			$( '.bm-codeLine .flag' ).toggle( $(this).is( ':checked' ) );
		}

		function toggleWinCode () {
			$( '.bm-codeLine .win' ).toggle( $(this).is( ':checked' ) );
		}

		function toggleHideRoundTitles () {
			$( '.bm-codeLine.bm-hideroundtitles' ).toggle( $(this).is( ':checked' ) );
		}

		function togglePlayerCellWidth () {
			$( '.bm-codeLine.bm-playerCellWidth' ).toggle( $(this).is( ':checked' ) );
		}

		function toggleScoreCellWidth () {
			$( '.bm-codeLine.bm-scoreCellWidth' ).toggle( $(this).is( ':checked' ) );
		}

		function playerCellWidthValueChange () {
			$( '.bm-codeLine.bm-playerCellWidth .bm-parameter-value' ).text( $(this).val() );
		}

		function scoreCellWidthValueChange () {
			$( '.bm-codeLine.bm-scoreCellWidth .bm-parameter-value' ).text( $(this).val() );
		}

		function toggleMatchDetails() {
			$( '.bm-codeLine.bm-gamedetails' ).toggleClass( 'match-details-hidden', !$(this).is( ':checked' ) );
		}

		function toggleOtherField ( event ) {
			var $t;
			if ( event !== undefined && event.delegateTarget !== undefined ) {
				$t = $(event.delegateTarget);
			} else {
				$t = $(this);
			}
			$t.find( 'input[type="radio"]' ).each( function () {
				$( '.bm-codeLine.line-' + $(this).attr('rel') ).toggleClass( $(this).val(), $(this).is(':checked') );
			});
		}

		function toggleBoldWinnersNames () {
			$( '.bm-codeLine .bold-quotes' ).toggleClass( 'hidden', !$(this).is( ':checked' ) );
		}
		
		function optionsPlayerFieldsSortStart ( event, ui ) {
			ui.item.startIndex = ui.item.index();
		}

		function optionsPlayerFieldsSortUpdate ( event, ui ) {
			$( '.bm-codeLine.bm-player' ).each( function () {
				var sourceSpan = $(this).children( 'span:nth-child(' + ( ui.item.startIndex + 1 ) + ')' );
				var targetSpan = $(this).children( 'span:nth-child(' + ( ui.item.index() + 1 ) + ')' );

				if ( ui.item.startIndex < ui.item.index() ) {
					targetSpan.after( sourceSpan );
				} else {
					targetSpan.before( sourceSpan );
				}
			} );
			// Show the space after parameters for the first children
			// and hide the space at the end of the line
			for ( i = 0; i < 5; i++ ) {
				$( '.bm-codeLine.bm-player' ).children( 'span:nth-child(' + i + ')' ).children( '.after-space' ).show();
			}
			$( '.bm-codeLine.bm-player' ).children( 'span:nth-child(' + i + ')' ).children( '.after-space' ).hide();
		}

		this.selectAll = function () {
			var textarea = document.createElement( 'textarea' ),
				$textarea,
				lineTexts = $.map( code.$code.children( ':visible' ).map( code.getCodeLineText ), $.trim ),
				text = $.makeArray( lineTexts ).join( '\r' );

			code.$code.append( textarea );
			$textarea = code.$code.find( 'textarea' );
			$textarea.attr( 'readonly', true );
			$textarea.text( text );
			$textarea.focus().select();
		};

		this.textareaBlur = function () {
			code.$code.find( 'textarea' ).remove();
		};

		this.getCodeLineText = function () {
			var sectionTexts = $(this).children( ':visible' ).map( function() {
				if ( $(this).children( ':visible' ).length > 0 ) {
					return code.getCodeLineText.call( this );
				} else {
					return $(this).text();
				}
			});
			return $.makeArray( sectionTexts ).join('');
		};

		this.setFlag = function ( position, flagText ) {
			$( '.bm-player.' + position + ' .flag .bm-parameter-value .pure-value' ).text( flagText );
		};

		this.setRace = function ( position, raceText ) {
			$( '.bm-player.' + position + ' .race .bm-parameter-value .pure-value' ).text( raceText );
		};

		this.setName = function ( position, name, isWinner ) {
			$( '.bm-player.' + position + ' .name .bm-parameter-value .bold-quotes' ).toggleClass( 'not-winner', !isWinner );
			$( '.bm-player.' + position + ' .name .bm-parameter-value .pure-value' ).text( name );
		};

		this.setScore = function ( position, score ) {
			$( '.bm-player.' + position + ' .score .bm-parameter-value .pure-value' ).text( score );
		};

		this.setScore2 = function ( position, score ) {
			$( '.bm-player-2.' + position + ' .score2 .bm-parameter-value' ).text( score );
		};

		this.setWin = function ( position, isWinner ) {
			$( '.bm-player.' + position + ' .win .bm-parameter-value .pure-value' ).text( isWinner ? '1' : '' );
		};

		this.setExtendedSeries = function ( match, isExtendedSeries ) {
			$( '.bm-player.' + match + '-1 .score .bm-parameter-value .extended-series' ).toggle( isExtendedSeries );
			$( '.bm-player.' + match + '-2 .score .bm-parameter-value .extended-series' ).toggle( isExtendedSeries );
		};

		this.toggleMap = function ( match, mapNumber, enabled ) {
			$( '.' + match + '.map-' + mapNumber ).toggleClass( 'hidden-map', !enabled );
		};

		this.setMap = function ( match, mapNumber, map ) {
			$( '.' + match + '.map-' + mapNumber + ' .map .bm-parameter-value .pure-value' ).text( map );
		};

		this.setMapwin = function ( match, mapNumber, mapwin ) {
			$( '.' + match + '.map-' + mapNumber + ' .mapwin .bm-parameter-value .pure-value' ).text( mapwin );
		};

		this.setVodgame = function ( match, mapNumber, vodgame ) {
			$( '.' + match + '.map-' + mapNumber + ' .vodgame .bm-parameter-value .pure-value' ).text( vodgame );
		};

		this.setDate = function ( match, date ) {
			$( '.' + match + ' .date .bm-parameter-value .pure-value' ).text( date );
			$( '.' + match + '.line-date' ).toggleClass( 'empty-parameter', date == '' || date === undefined );
		};

		this.setPreview = function ( match, preview ) {
			$( '.' + match + ' .preview .bm-parameter-value .pure-value' ).text( preview );
			$( '.' + match + '.line-preview' ).toggleClass( 'empty-parameter', preview == '' || preview === undefined );
		};

		this.setLRThread = function ( match, lrthread ) {
			$( '.' + match + ' .lrthread .bm-parameter-value .pure-value' ).text( lrthread );
			$( '.' + match + '.line-lrthread' ).toggleClass( 'empty-parameter', lrthread == '' || lrthread === undefined );
		};

		this.setInterview = function ( match, interview ) {
			$( '.' + match + ' .interview .bm-parameter-value .pure-value' ).text( interview );
			$( '.' + match + '.line-interview' ).toggleClass( 'empty-parameter', interview == '' || interview === undefined );
		};

		this.setRecap = function ( match, recap ) {
			$( '.' + match + ' .recap .bm-parameter-value .pure-value' ).text( recap );
			$( '.' + match + '.line-recap' ).toggleClass( 'empty-parameter', recap == '' || recap === undefined );
		};

		this.setComment = function ( match, comment ) {
			$( '.' + match + ' .field-comment .bm-parameter-value .pure-value' ).text( comment );
			$( '.' + match + '.line-comment' ).toggleClass( 'empty-parameter', comment == '' || comment === undefined );
		};

		this.toggleThirdPlaceMatch = function ( showOrHide ) {
			$( '.bm-codeLine.bm-code-thirdPlaceMatch' ).toggleClass( 'hidden-third-place-match', !showOrHide );
		}

		this.setRoundDefaultTitle = function ( round, defaultTitle ) {
			defaultRoundTitles[ round ] = defaultTitle;
		};

		this.setRoundTitle = function ( round, title ) {
			title = title == null ? defaultRoundTitles[ round ] : title;
			$( '#bm-codeLine-' + round ).toggle( defaultRoundTitles[ round ] != title );
			$( '#bm-codeLine-' + round + ' .bm-parameter-value').text( title );
		};

		this.html = function ( htmlString ) {
			code.$code.html( htmlString );
		};

		this.applyUserOptions = function () {
			$( '.bm-codeLine .race' ).toggle( this.$showRaceCode.is( ':checked' ) );
			$( '.bm-codeLine .flag' ).toggle( this.$showFlagCode.is( ':checked' ) );
			this.toggleThirdPlaceMatch( $( '#bm-show-third-place-match' ).is( ':checked' ) );
			$( '.bm-codeLine.bm-hideroundtitles' ).toggle( this.$hideRoundTitles.is( ':checked' ) );
			$( '.bm-codeLine.bm-playerCellWidth' ).toggle( this.$playerCellWidth.is( ':checked' ) );
			$( '.bm-codeLine.bm-scoreCellWidth' ).toggle( this.$scoreCellWidth.is( ':checked' ) );
			$( '.bm-codeLine.bm-gamedetails' ).toggleClass( 'match-details-hidden', !this.$showMatchDetails.is( ':checked' ) );
			this.applyOptionsPlayerFieldsOrder();
			this.applyOptionBoldWinnersNames();
			this.applyOptionOtherFieldsParameters();
		};

		this.applyOptionsPlayerFieldsOrder = function () {
			var fieldOrder = [],
				$fields = {},
				i;

			this.$playerFields.children( 'li' ).each( function ( index ) {
				var id = $(this).attr( 'id' ),
					field = id.substring( id.lastIndexOf( '-' ) + 1 );
				fieldOrder[ index ] = field;
			});

			$( '.bm-codeLine.bm-player' ).each( function () {
				var playerCodeLine = this;

				$fields.name = $(this).children( '.name' ).detach(),
				$fields.race = $(this).children( '.race' ).detach(),
				$fields.flag = $(this).children( '.flag' ).detach(),
				$fields.score = $(this).children( '.score' ).detach();
				$fields.win = $(this).children( '.win' ).detach();

				$.each( fieldOrder, function( index ) {
					$fields[ fieldOrder[index] ].appendTo( playerCodeLine );
				});
			});
			
			// Show the space after parameters for the first children
			// and hide the space at the end of the line
			for ( i = 0; i < $fields.length; i++ ) {
				$( '.bm-codeLine.bm-player' ).children( 'span:nth-child(' + i + ')' ).children( '.after-space' ).show();
			}
			$( '.bm-codeLine.bm-player' ).children( 'span:nth-child(' + i + ')' ).children( '.after-space' ).hide();
		};

		this.applyOptionBoldWinnersNames = function () {
			toggleBoldWinnersNames.call( this.$boldWinnersNames );
		};

		this.applyOptionOtherFieldsParameters = function () {
			$.each( otherFields, function ( i, field ) {
				toggleOtherField.call( code.$otherFieldsParameters[ field ] );
			});
		};
	}

	mw.libs.bracketManager.classes.Code = Code;
}) ( mediaWiki, jQuery );