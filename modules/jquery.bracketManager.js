( function ( $ ) {

	var methods = {
		setFlagImg: function ( flag ) {
			if ( flag == '' ) {
				flag = '0';
			}
			return $(this).each( function () {
				if ( $(this).attr( 'class' ) !== undefined ) {
					var flagClassMatches = $(this).attr( 'class' ).match( /(bm-flag-[0a-z]*)/g );
					if ( flagClassMatches.length > 1 ) {
						flagClassMatches.shift();
						var elem = $(this);
						$.each( flagClassMatches, function ( i, flagClass ) {
							elem.removeClass( flagClass );
						} );
					}
				}
				$(this).addClass( 'bm-flag-' + flag );
				$(this).attr( 'alt', flag );
				$(this).attr( 'title', flag );
			} );
		},
		setRaceClass: function ( race ) {

			return $(this).each( function () {
				if ( $(this).attr( 'class' ) !== undefined ) {
					var raceClassMatch = $(this).attr( 'class' ).match( /(?:\s|^)bm-race-([pztr0]|BYE)(?:\s|$)/ );
					if ( raceClassMatch != null ) {
						$(this).removeClass( raceClassMatch[0] );
					}
				}
				$(this).addClass( 'bm-race-' + race );
			} );
		},
		setRaceImg: function ( race ) {
			
			return $(this).each( function () {
				if ( $(this).attr( 'class' ) !== undefined ) {
					var raceClassMatch = $(this).attr( 'class' ).match( /(?:\s|^)bm-race-edit-([pztr0]|BYE)(?:\s|$)/ );
					if ( raceClassMatch != null )
						$(this).removeClass( raceClassMatch[0] );
				}
				$(this).addClass( 'bm-race-edit-' + race );
				$(this).attr( 'alt', race );
				$(this).attr( 'title', race );
			} );
		},
		bold: function () {
			var name = $(this).val();
			if ( name.indexOf( "'''" == 0 ) && name.lastIndexOf( "'''" ) == name.length - 3 ) {
				$(this).val( name.substring( 3, name.length - 3 ) );
			} else {
				$(this).val( "'''" + name + "'''" );
			}
		},
		italicize: function () {
			var name = $(this).val();
			if ( name.indexOf( "''" == 0 ) && name.lastIndexOf( "''" ) == name.length - 2 ) {
				$(this).val( name.substring( 2, name.length - 2 ) );
			} else {
				$(this).val( "''" + name + "''" );
			}
		}
	};

	$.fn.bracketManager = function ( method ) {
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.bracketManager' );
		}
	}

} )( jQuery );