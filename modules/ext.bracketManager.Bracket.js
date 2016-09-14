( function ( mw, $ ) {
	function Bracket ( bm, data ) {

		var bracket = this;

		this.showRaceIcons = false;

		this.getListIndexObject = function () {
			var listIndex = {};

			$( '.bm-match-line .bm-match-source-list.bm-match-player' ).each( function ( index ) {
				$(this).data( 'listIndex', index );
				listIndex[ $(this).attr( 'id' ) ] = index;
			} );
			$( '.bm-match-line div:not(.bm-match-source-list).bm-match-player' ).each( function () {
				$(this).data( 'listIndex', -1 );
				listIndex[ $(this).attr( 'id' ) ] = -1;
			} );

			return listIndex;
		};

		this.getBracketPositionsArray = function () {
			var bracketPositions = [];

			$( '.bm-match-source-list.bm-match-player' ).each( function ( index ) {
				bracketPositions[ index ] = [ $(this).attr( 'id' ) ];
			} );

			return bracketPositions;
		};

		this.propagateListIndexes = function () {
			$.each( data.listIndex, function ( position, listIndex ) {
				var $player = $( '#' + position ),
					elems = [
					'.bm-flag-edit:not(.prev)',
					'.bm-flag-edit-text',
					'.bm-race-edit',
					'.bm-race-edit-p',
					'.bm-race-edit-z',
					'.bm-race-edit-t',
					'.bm-race-edit-r',
					'.bm-race-edit-BYE',
					'.bm-race-edit-0',
					'.bm-name-edit'
				];
				/*if ( listIndex >= 0 ) {
					$player.addClass('bm-match-source-list');
				}*/
				$.each( elems, function ( i, v ) {
					$player.find( v ).data( 'listIndex', listIndex );
				});
			} );
		};

		this.hideFlagAndRaceHelpers = function () {
			$( '.bm-flag-edit-helper' ).hide();
			$( '.bm-race-edit-helper' ).hide();
		};

		this.setEditable = function ( position, editable ) {
			var $player = $( '#' + position );
			$player.toggleClass('bm-match-editable', editable);
			$player.find('.bm-name-edit').attr( 'readonly', !editable );
		};

		this.applyUserOptions = function ( thirdPlaceMatchAvailable ) {
			bracket.showRaceIcons = bracket.$showRaceIcons.is( ':checked' );
			// Show/Hide the race icons (according to the value of the checkbox 'showRaceIcons')
			$( '.bm-match-race' ).toggle( bracket.$showRaceIcons.is( ':checked' ) );

			// Enable/Disable the checkbox 'thirdplacematch'
			if ( thirdPlaceMatchAvailable )
				bm.$thirdPlaceMatch.removeAttr( 'disabled' );
			else
				bm.$thirdPlaceMatch.attr( 'disabled', 'disabled' );

			// Show/Hide the third place match
			$( '.bm-match.third-place' ).toggle( $( '#bm-show-third-place-match' ).is( ':checked' ) );
			$( '.bm-hmain .third-place-match-label' ).toggle( $( '#bm-show-third-place-match' ).is( ':checked' ) );
		};

		this.setFlag = function ( position, flag ) {
			var $player = $( '#' + position );
			var flagText = ( flag != '0' ? flag : '' );

			$player.find( '.bm-flag-edit:not(.prev)' ).bracketManager( 'setFlagImg', flag );
			if ( $player.is('.bm-match-editable') ) {
				$player.find( '.bm-flag-edit.prev' ).bracketManager( 'setFlagImg', flag );
				$player.find( '.bm-flag-edit-text' ).val( flagText );
			}
		};

		this.setFlagPrev = function ( position, flag ) {
			$( '#bm-flag-edit-prev-' + position ).bracketManager( 'setFlagImg', flag );
		};

		this.setRace = function ( position, race ) {
			var $player = $( '#' + position );

			$player.find( '.bm-race-edit' ).bracketManager( 'setRaceImg', race );
			$player.bracketManager( 'setRaceClass', race );
		};

		this.setName = function ( position, name ) {
			$( '#' + position ).find( '.bm-name-edit' ).val( name );
		};

		this.setProperty = function ( position, property, value ) {
			var propertyUcFirst = property.charAt(0).toUpperCase() + property.slice(1);
			this[ 'set' + propertyUcFirst ]( position, value );
		};

		this.removeSource = function ( position, source ) {
			$( '#' + position ).removeClass( 'bm-match-source-' + source );
		};

		this.addSource = function ( position, source ) {
			$( '#' + position ).addClass( 'bm-match-source-' + source );
		};

		this.setScore = function ( position, score ) {
			$( '#bm-score-edit-' + position ).val( score );
		};

		this.setScore2 = function ( position, score ) {
			$( '#bm-score-2-edit-' + position ).val( score );
		};

		this.setExtendedSeries = function ( match, isExtendedSeries ) {
			$( '#bm-match-' + match ).toggleClass( 'extended-series', isExtendedSeries );
		};

		this.bold = function ( position, bold ) {
			$( '#' + position ).toggleClass( 'match-winner', bold );
		};

		this.setLoserEditSource = function ( position, source ) {
			/*$( '#loserEdit-' + position ).val( source );*/
			var sourceText = source == 'none' ? 'None' : 'Loser of ' + source;
			$( '#bm-match-loserEdit-info-text-' + position ).text( sourceText );
		};

		this.setPropertyLI = function ( listIndex, property, value ) {
			$.map( data.bracketPositions[ listIndex ], function ( position ) {
				bracket.setProperty( position, property, value );
			});
		};

		this.setListIndex = function ( position, listIndex ) {
			$( '#' + position ).data( 'listIndex', listIndex );
		};

		this.setRoundTitle = function ( round, roundTitle ) {
			$( '#bm-round-title-edit-' + round ).val( roundTitle );
		};

		this.loading = function ( showOrHide ) {
			if ( showOrHide ) {
				$('#bm-bracket-div').addClass( 'loading' );
				$('#bm-bracket-div').html( '<div class="spinner">Loading...</div>' );
			} else {
				$( '#bm-bracket-div' ).removeClass( 'loading' );
			}
		};

		this.html = function ( htmlString ) {
			$( '#bm-bracket-div' ).html( htmlString );
		};

		/***/
		// Constants
		var KEYCODE_ENTER = 13;
		var KEYCODE_TAB = 9;
		var KEYCODE_DOWN = 38;
		var KEYCODE_UP = 40;

		function idToPos ( id ) {
			return id.substring( id.lastIndexOf( 'R' ) );
		}

		this.cacheElements = function () {
			// Checkboxes
			this.$showRaceIcons = $( '#bm-show-race-icons' );
			this.$modeCheckboxes = $( 'input:checkbox[name="bm-mode"]' );
			this.$seedEditorMode = $( '#bm-seed-editor-mode' );
			this.$matchDetailsMode = $( '#bm-match-details-mode' );

			// Pushbuttons
			this.$bold = $( '#bm-bold' );
			this.$italic = $( '#bm-italic' );

			// Other
			this.$bracketDiv = $( '#bm-bracket-div' );
		};

		this.bindEvents = function () {
			this.bindCheckBoxEvents();
			this.bindPushButtonEvents();
			this.bindDelegateEvents();
		};

		this.bindCheckBoxEvents = function () {
			this.$showRaceIcons.on( 'change', this.toggleRaceIcons );
			this.$modeCheckboxes.on( 'change', this.toggleMode );
		};

		this.bindPushButtonEvents = function () {
		};

		this.bindDelegateEvents = function () {
			this.bindRoundsEvents();
			this.bindLoserEditEvents();
			this.bindScoreEvents();
			this.bindFlagEvents();
			this.bindRaceEvents();
			this.bindNameEvents();
			this.bindLoserEditSourceRemoveEvents();
			this.bindOverlayEvents();
		};
		
		this.bindRoundsEvents = function () {
			this.$bracketDiv.delegate( '.bm-round-title-edit', 'change', bm.roundsInputChange );
		};

		this.bindLoserEditEvents = function () {
			this.$bracketDiv.delegate( '.loserEdit-select', 'change', bm.loserEditSelectChange );
		};

		this.bindScoreEvents = function () {
			this.$bracketDiv.delegate( '.bm-score-edit', 'change', bm.scoreEditChange );
		};

		this.bindFlagEvents = function () {
			this.$bracketDiv.delegate( '.bm-match-editable .bm-flag-edit-text', {
				keyup: this.flagTextKeyUp,
				keydown: this.flagTextKeyDown
			});
			this.$bracketDiv.delegate( '.bm-match-editable .bm-flag-edit:not(.prev)', {
				click: this.flagImgClick,
				focus: this.flagImgFocus
			});
		};

		this.bindRaceEvents = function () {
			this.$bracketDiv.delegate( '.bm-match-editable .bm-race-edit', {
				click: this.raceImgClick,
				keydown: this.raceImgKeyDown
			});
			this.$bracketDiv.delegate( '.bm-match-editable .bm-race-edit-prev', 'click', this.raceImgPrevClick );
		};

		this.bindNameEvents = function () {
			this.$bracketDiv.on( {
					change: this.nameChange,
					keydown: this.nameKeyDown,
					focusin: this.nameFocusIn
				},
				'.bm-match-editable .bm-name-edit'
			);
		};

		this.bindLoserEditSourceRemoveEvents = function () {
			this.$bracketDiv.delegate( '.bm-match-loserEdit-remove', {
				click: this.loserEditSourceRemoveClick
			});
		};

		this.bindOverlayEvents = function () {
			this.$bracketDiv.delegate( '.bm-match-overlay.match-details', {
				click: this.matchOverlayClick
			});
		};

		this.toggleRaceIcons = function () {
			bracket.showRaceIcons = $(this).is( ':checked' );

			bracket.$bracketDiv.find( '.bm-match-race' ).toggle( bracket.showRaceIcons );
			bracket.$bracketDiv.find( '.bm-name-edit' ).toggleClass( 'short', bracket.showRaceIcons );
		};

		this.toggleMode = function () {
			bracket.$modeCheckboxes.not(this).attr( 'checked', false );

			bracket.toggleSeedEditorMode( bracket.$seedEditorMode.is( ':checked' ) );
			bracket.toggleMatchDetailsMode( bracket.$matchDetailsMode.is( ':checked' ) );
			$( '.bm-match-overlay' ).toggleClass( 'seed-editor', bracket.$seedEditorMode.is( ':checked' ) );
			$( '.bm-match-overlay' ).toggleClass( 'match-details', bracket.$matchDetailsMode.is( ':checked' ) );
			$( '.bm-match-overlay' ).toggle( bracket.$seedEditorMode.is( ':checked' ) || bracket.$matchDetailsMode.is( ':checked' ) );
		};

		this.toggleSeedEditorMode = function ( isChecked ) {
			$( '.bm-match-id' ).toggle( isChecked );
			$( '.bm-match-move' ).toggle( isChecked );
			$( '.bm-match-loserEdit-seed' ).toggle( isChecked );
			$( '.bm-match-loserEdit-target' ).toggle( isChecked );
			$( '.bm-match-loserEdit-info' ).toggle( isChecked );
		};

		this.toggleMatchDetailsMode = function ( isChecked ) {
			$( '#bm-match-details' ).toggle( isChecked );
			$( '#bm-match-' + data.selectedMatch + ' .bm-match-overlay' ).toggleClass( 'active', isChecked );
			bm.updateSelectedMatch();
		};

		this.flagTextKeyUp = function () {
			var position = idToPos( $(this).attr( 'id' ) ),
				val = $(this).val();
			// Preview the flag only if the country code entered is 2-or-more-character-long.
			if ( val.length > 1 ) {
				bracket.setFlagPrev( position, val );
			}
		};

		this.flagTextKeyDown = function ( event ) {
			var keyCode = event.which,
				position = idToPos( $(this).attr( 'id' ) ),
				editableIndex = data.editableIndex[ position ],
				nextIndex, nextPos;

			if ( keyCode == KEYCODE_ENTER || keyCode == KEYCODE_TAB ||
				keyCode == KEYCODE_DOWN || keyCode == KEYCODE_UP ) {
				$( '#bm-flag-edit-' + position ).click();
				event.preventDefault();
			}
			switch ( keyCode ) {
			case KEYCODE_DOWN:
			case KEYCODE_UP:
				nextIndex = editableIndex + ( keyCode - 39 );
				if ( data.editableBracketPosition[ nextIndex ] !== undefined ) {
					nextPos = data.editableBracketPosition[ nextIndex ];
					bracket.switchTo( nextPos, 'flag' );
				} else if ( keyCode == KEYCODE_DOWN ) {
					nextPos = data.editableBracketPosition[ data.editableBracketPosition.length - 1 ];
					bracket.switchTo( nextPos, 'name' );
				} else {
					nextPos = data.editableBracketPosition[0];
					bracket.switchTo( nextPos, bracket.showRaceIcons ? 'race' : 'name' );
				}
				break;
			case KEYCODE_TAB:
				if ( event.shiftKey ) {
					if ( editableIndex > 0 ) {
						nextPos = data.editableBracketPosition[ editableIndex - 1 ];
						bracket.switchTo( nextPos, 'name' );
					} else {
						nextPos = data.editableBracketPosition[ data.editableBracketPosition.length - 1 ];
						bracket.switchTo( nextPos, 'name' );
					}
				} else {
					nextPos = data.editableBracketPosition[ editableIndex ];
					bracket.switchTo( nextPos, bracket.showRaceIcons ? 'race' : 'name' );
				}
			}
		};

		this.flagImgClick = function () {
			var position   = idToPos( $(this).attr( 'id' ) ),
				$helperElem = $( '#bm-flag-edit-helper-' + position ),
				$divElem    = $( '#bm-match-flag-' + position ),
				$textElem   = $( '#bm-flag-edit-text-' + position );

			$helperElem.toggle();
			if ( $helperElem.css( 'display' ) != 'none' ) {
				$(this).addClass( 'bm-flag-active' );
				$divElem.one( 'clickoutside', function () {
					bracket.closeFlagHelperAndSetFlag( position );
				} );
				$textElem.focus().select();
			} else {
				bracket.closeFlagHelperAndSetFlag( position );
			}
		};

		this.closeFlagHelperAndSetFlag = function ( position ) {
			var listIndex = -1,
				$imgElem    = $( '#bm-flag-edit-' + position ),
				$divElem    = $( '#bm-match-flag-' + position ),
				$textElem   = $( '#bm-flag-edit-text-' + position ),
				$helperElem = $( '#bm-flag-edit-helper-' + position );
			
			$helperElem.hide();
			$divElem.unbind( 'clickoutside' );
			$imgElem.removeClass( 'bm-flag-active' );
			if ( data.fullManualMode ) {
				bm.propagateFlagPos( position, $textElem.val() );
			} else {
				listIndex = data.listIndex[ position ];
				bm.setPropertyLI( listIndex, 'flag', $textElem.val() );
				bm.propagateFlag( listIndex );
				bm.computeRacesAndFlagsForListIndex( listIndex );
			}
		};
		
		this.flagImgFocus = function () {
			var position = idToPos( $(this).attr( 'id' ) );
			$( '#bm-flag-edit-text-' + position ).focus();
		};

		this.raceImgClick = function () {
			var position  = idToPos( $(this).attr( 'id' ) ),
				listIndex = data.listIndex[ position ],
				$imgElem    = $(this),
				$helperElem = $( '#bm-race-edit-helper-' + position ),
				$divElem    = $( '#bm-match-race-' + position );

			$helperElem.toggle();
			if ( $helperElem.css( 'display' ) != 'none' ) {
				$(this).addClass( 'bm-race-active' );
				$divElem.one( 'clickoutside', function () {
					$imgElem.removeClass( 'bm-race-active' );
					$helperElem.hide();
				});
			} else {
				$imgElem.removeClass( 'bm-race-active' );
				$divElem.unbind( 'clickoutside' );
			}
		};

		this.raceImgKeyDown = function ( event ) {
			var keyCode = event.which,
				position = idToPos( $(this).attr( 'id' ) ),
				editableIndex = data.editableIndex[ position ],
				nextIndex, nextPos,
				$helperElem = $( '#bm-race-edit-helper-' + position ),
				$byeElem    = $( '#bm-race-edit-BYE-' + position ),
				race;

			if ( keyCode == KEYCODE_ENTER || keyCode == KEYCODE_TAB ||
				keyCode == KEYCODE_DOWN || keyCode == KEYCODE_UP ) {
				if ( $helperElem.css( 'display' ) != 'none' ) {
					$(this).click();
				}
				event.preventDefault();
			}
			switch ( keyCode ) {
			case KEYCODE_DOWN:
			case KEYCODE_UP:
				nextIndex = editableIndex + ( keyCode - 39 );
				if ( data.editableBracketPosition[ nextIndex ] !== undefined ) {
					nextPos = data.editableBracketPosition[ nextIndex ];
					bracket.switchTo( nextPos, 'race' );
				} else if ( keyCode == KEYCODE_DOWN ) {
					nextPos = data.editableBracketPosition[ data.editableBracketPosition.length - 1 ];
					bracket.switchTo( nextPos, 'flag' );
				} else {
					nextPos = data.editableBracketPosition[0];
					bracket.switchTo( nextPos, 'name' );
				}
				break;

			case KEYCODE_TAB:
				nextPos = data.editableBracketPosition[ editableIndex ];
				bracket.switchTo( nextPos, event.shiftKey ? 'flag' : 'name' );
				break;

			case 'P'.charCodeAt( 0 ):
			case 'Z'.charCodeAt( 0 ):
			case 'T'.charCodeAt( 0 ):
			case 'R'.charCodeAt( 0 ):
				race = String.fromCharCode( keyCode ).toLowerCase();
				$( '#bm-race-edit-' + race + '-' + position ).click();
				break;

			case 'B'.charCodeAt( 0 ):
				$byeElem.click();
				break;
			}
		};

		this.raceImgPrevClick = function () {
			var position  = idToPos( $(this).attr( 'id' ) ),
				listIndex = data.listIndex[ position ],
				raceAlt   = $(this).attr( 'alt' ),
				thisID    = $(this).attr( 'id' ),
				raceVal,
				$helperElem = $( '#bm-race-edit-helper-' + position ),
				$imgElem    = $( '#bm-race-edit-' + position );

			if ( raceAlt == 'Unknown' )
				raceVal = '0';
			else
				raceVal = raceAlt;

			if ( data.fullManualMode ) {
				bm.propagateRacePos( position, raceVal );
			} else {
				bm.setPropertyLI( listIndex, 'race', raceVal );
				bm.propagateRace( listIndex );
				bm.computeRacesAndFlagsForListIndex( listIndex );
			}

			if ( $helperElem.css( 'display' ) != 'none' ) {
				$imgElem.click();
			}
		};

		this.nameChange = function () {
			var position  = idToPos( $(this).attr( 'id' ) ),
				listIndex = data.listIndex[ position ];
			
			if ( data.fullManualMode ) {
				bm.propagateNamePos( position, $(this).val() );
			} else {
				bm.setPropertyLI( listIndex, 'name', $(this).val() );
				bm.propagateName( listIndex );
			}
		};

		this.nameKeyDown = function ( event ) {
			var keyCode = event.which,
				position  = idToPos( $(this).attr( 'id' ) ),
				editableIndex = data.editableIndex[ position ],
				nextIndex;
			if ( keyCode == KEYCODE_TAB ||
				keyCode == KEYCODE_DOWN || keyCode == KEYCODE_UP ) {
				event.preventDefault();
			}
			switch ( keyCode ) {
			case KEYCODE_DOWN:
			case KEYCODE_UP:
				nextIndex = editableIndex + ( keyCode - 39 );
				if ( data.editableBracketPosition[ nextIndex ] !== undefined ) {
					nextPos = data.editableBracketPosition[ nextIndex ];
					bracket.switchTo( nextPos, 'name' );
				} else if ( keyCode == KEYCODE_DOWN ) {
					nextPos = data.editableBracketPosition[ data.editableBracketPosition.length - 1 ];
					bracket.switchTo( nextPos, bracket.showRaceIcons ? 'race' : 'flag' );
				} else {
					nextPos = data.editableBracketPosition[0];
					bracket.switchTo( nextPos, 'flag' );
				}
				break;
			case KEYCODE_TAB:
				if ( !event.shiftKey ) {
					if ( data.editableBracketPosition[ editableIndex + 1 ] !== undefined ) {
						nextPos = data.editableBracketPosition[ editableIndex + 1 ];
						bracket.switchTo( nextPos, 'flag' );
					} else {
						nextPos = data.editableBracketPosition[0];
						bracket.switchTo( nextPos, 'flag' );
					}
				} else {
					nextPos = data.editableBracketPosition[ editableIndex ];
					bracket.switchTo( nextPos, bracket.showRaceIcons ? 'race' : 'flag' );
				}
				break;
			case 'B'.charCodeAt( 0 ):
				if ( event.ctrlKey ) {
					$(this).bracketManager( 'bold' );
				}
				break;
			case 'I'.charCodeAt( 0 ):
				if ( event.ctrlKey ) {
					$(this).bracketManager( 'italicize' );
				}
				break;
			}
		};

		this.nameFocusIn = function () {
			$(this).one( 'clickoutside', function ( event ) {
				if ( $(event.target).is( $( '#bm-bold' ) ) ) {
					$(this).bracketManager( 'bold' );
					$(this).focus();
				} else if ( $(event.target).is( $( '#bm-italic' ) ) ) {
					$(this).bracketManager( 'italicize' );
					$(this).focus();
				}
			});
		};

		this.switchTo = function ( position, item ) {
			switch ( item ) {
			case 'flag':
				$( '#bm-flag-edit-' + position ).click();
				break;
			case 'race':
				$( '#bm-race-edit-' + position ).focus().click();
				break;
			case 'name':
				$( '#bm-name-edit-' + position ).focus();
				break;
			case 'score':
				$( '#bm-score-edit-' + position ).focus();
			}
		};

		this.loserEditSourceRemoveClick = function () {
			var position = idToPos( $(this).attr( 'id' ) );
			bracket.setLoserEditSource( position, 'none' );
			bm.loserEditChange( position, 'none' );
		};

		this.matchOverlayClick = function () {
			var selectedMatch = idToPos( $(this).parent().attr('id') );

			bm.updateSelectedMatch( selectedMatch );
		};

		this.updateSelectedOverlay = function ( selectedMatch ) {
			$( '.bm-match-overlay.active' ).removeClass( 'active' );
			$( '#bm-match-' + selectedMatch ).find( '.bm-match-overlay' ).addClass( 'active' );
		};

		this.initMatchMoveUI = function () {
			this.initListMatchMoveUI();
			this.initLoserEditMatchMoveUI();
		};

		this.initListMatchMoveUI = function () {
			$( '.bm-match-player.bm-match-source-list' ).each( function () {
				$(this).draggable( {
					scope: 'list',
					containment: bracket.$bracketDiv,
					handle: '.bm-match-move-draggable',
					helper: function( event ) {
						return $( '<div class="bm-match-move-helper bm-match-move-list-helper"></div>' );
					},
					start: function ( event, ui ) {
						$( '.bm-match-player.bm-match-source-list' ).not( $(this) ).children( '.bm-match-move-draggable' ).hide();
					},
					stop: function ( event, ui ) {
						$( '.bm-match-player.bm-match-source-list' ).not( $(this) ).children( '.bm-match-move-draggable' ).show();
					},
					cursorAt: { top: 11, left: 11 },
					zIndex: 2
				});
			});
			$( '.bm-match-move-list.bm-match-move-droppable' ).droppable( {
				scope: 'list',
				activeClass: 'bm-match-move-active',
				hoverClass: 'bm-match-move-hover',
				drop: function ( event, ui ) {
					var sourcePos = idToPos( ui.draggable.attr('id') ),
						targetPos = idToPos( $(this).attr('id') );

					console.log( 'list move: ' + sourcePos + ' > ' + targetPos );
					bm.swapPlayers( sourcePos, targetPos );
				}
			});
		};

		this.initLoserEditMatchMoveUI = function () {
			$( '.bm-match-loserEdit-seed' ).each( function () {
				console.log( $(this).attr('id') + ' in scope ' + classToScope( $(this).attr( 'class' ) ) );
				$(this).draggable( {
					scope: 'loserEdit-' + classToScope( $(this).attr( 'class' ) ),
					containment: bracket.$bracketDiv,
					helper: function( event ) {
						return $( '<div class="bm-match-move-helper bm-match-move-loserEdit-helper"></div>' );
					},
					start: function ( event, ui ) {
						$( '.bm-match-loserEdit-seed' ).not( $(this) ).addClass( 'bm-ghost' );
					},
					stop: function ( event, ui ) {
						$( '.bm-match-loserEdit-seed' ).not( $(this) ).removeClass( 'bm-ghost' );
					},
					cursorAt: { top: 11, left: 11 },
					zIndex: 2
				});
			});
			$( '.bm-match-loserEdit-target' ).each( function () {
				console.log( $(this).attr('id') + ' in scope ' + classToScope( $(this).attr( 'class' ) ) );
				$(this).droppable( {
					scope: 'loserEdit-' + classToScope( $(this).attr( 'class' ) ),
					activeClass: 'bm-match-move-active',
					hoverClass: 'bm-match-move-hover',
					drop: function ( event, ui ) {
						var source = idToPos( ui.draggable.attr('id') ),
							targetPos = idToPos( $(this).attr('id') );

						console.log( 'loserEdit: ' + source + ' > ' + targetPos );
						bracket.setLoserEditSource( targetPos, source );
						bm.loserEditChange( targetPos, source );

					}
				});
			});
		};

		this.addEditableClass = function () {
			if ( data.fullManualMode ) {
				$( '.bm-match-player' ).addClass( 'bm-match-editable' );
			} else {
				$( '.bm-match-source-list' ).addClass( 'bm-match-editable' );
			}
		};

		function classToScope( classStr ) {
			var scopeMatch = classStr.match( /bm-match-loserEdit-(seed|target)-(R[0-9]*)/ );
			if ( scopeMatch === null ) {
				return null;
			} else {
				return scopeMatch[2];
			}
		}
	}

	mw.libs.bracketManager.classes.Bracket = Bracket;
}) ( mediaWiki, jQuery );