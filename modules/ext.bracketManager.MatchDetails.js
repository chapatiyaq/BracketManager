( function ( mw, $ ) {
	function MatchDetails ( bm, data ) {
		var matchDetails = this;

		function idToMapNumber ( id ) {
			return id.substring( id.lastIndexOf( '-' ) + 1 );
		}

		this.cacheElements = function () {
			this.$div = $( '#bm-match-details' );
			this.$player1 = $( '#bm-match-details .player1' );
			this.$player1Flag = this.$player1.find( '.bm-flag-edit.prev' );
			this.$player1Race = this.$player1.find( '.bm-race-edit-prev' );
			this.$player1Name = this.$player1.find( '.name' );
			this.$player2 = $( '#bm-match-details .player2' );
			this.$player2Flag = this.$player2.find( '.bm-flag-edit.prev' );
			this.$player2Race = this.$player2.find( '.bm-race-edit-prev' );
			this.$player2Name = this.$player2.find( '.name' );
			this.$isExtendedSeries = this.$div.find( '#extended-series' );
			this.$mapEnabled = [];
			this.$map = [];
			this.$mapwin = [];
			this.$vodgame = [];
			for ( var i = 0; i < 9; i++ ) {
				this.$mapEnabled[i] = $( '#map-enabled-edit-' + ( i + 1 ) );
				this.$map[i] = $( '#map-edit-' + ( i + 1 ) );
				this.$mapwin[i] = $( '#mapwin-edit-' + ( i + 1 ) );
				this.$vodgame[i] = $( '#vodgame-edit-' + ( i + 1 ) );
			}
			this.$date = this.$div.find( '.date-edit' );
			this.$preview = this.$div.find( '.preview-edit' );
			this.$lrthread = this.$div.find( '.lrthread-edit' );
			this.$interview = this.$div.find( '.interview-edit' );
			this.$recap = this.$div.find( '.recap-edit' );
			this.$comment = this.$div.find( '.comment-edit' );
		};

		this.bindEvents = function () {
			this.$isExtendedSeries.on( 'click', this.toggleExtendedSeries );
			this.$div.on( 'click', '.map-enabled-edit', this.mapEnabledClick );
			this.$div.on( 'change', '.map-edit', this.mapChange );
			this.$div.on( 'change', '.mapwin-edit', this.mapwinChange );
			this.$div.on( 'change', '.vodgame-edit', this.vodgameChange );
			this.$div.on( 'keyup', '.game input[type="text"]',	this.mapInputKeyUp );
			this.$div.on( 'change', '.date-edit', this.dateChange );
			this.$div.on( 'change', '.preview-edit', this.previewChange );
			this.$div.on( 'change', '.lrthread-edit', this.lrthreadChange );
			this.$div.on( 'change', '.interview-edit', this.interviewChange );
			this.$div.on( 'change', '.recap-edit', this.recapChange );
			this.$div.on( 'change', '.comment-edit', this.commentChange );
		};

		this.toggleExtendedSeries = function () {
			bm.setExtendedSeries( data.selectedMatch, $(this).is( ':checked' ) );
		};

		this.mapEnabledClick = function () {
			var mapNumber = idToMapNumber( $(this).attr( 'id' ) );
			bm.setMapEnabled( data.selectedMatch, mapNumber, $(this).is( ':checked' ) );
		};

		this.mapChange = function () {
			var mapNumber = idToMapNumber( $(this).attr( 'id' ) );
			bm.setMap( data.selectedMatch, mapNumber, $(this).val() );
		};

		this.mapwinChange = function () {
			var mapNumber = idToMapNumber( $(this).attr( 'id' ) ),
				mapwin = $(this).val();
			if ( $(this).val() != '0' && $(this).val() != '1' && $(this).val() != '2' ) {
				mapwin = '';
			}
			$(this).val( mapwin );
			bm.setMapwin( data.selectedMatch, mapNumber, mapwin );
		};

		this.vodgameChange = function () {
			var mapNumber = idToMapNumber( $(this).attr( 'id' ) );
			bm.setVodgame( data.selectedMatch, mapNumber, $(this).val() );
		};

		this.mapInputKeyUp = function () {
			var mapNumber = idToMapNumber( $(this).attr( 'id' ) );
			if ( $(this).val() !== '' ) {
				$( '#map-enabled-edit-' + mapNumber ).attr( 'checked', true ).click();
				bm.setMapEnabled( data.selectedMatch, mapNumber, true );
			}
		};

		this.dateChange = function () {
			bm.setDate( data.selectedMatch, $(this).val() );
		};

		this.previewChange = function () {
			bm.setPreview( data.selectedMatch, $(this).val() );
		};

		this.lrthreadChange = function () {
			bm.setLRThread( data.selectedMatch, $(this).val() );
		};

		this.interviewChange = function () {
			bm.setInterview( data.selectedMatch, $(this).val() );
		};

		this.recapChange = function () {
			bm.setRecap( data.selectedMatch, $(this).val() );
		};

		this.commentChange = function () {
			bm.setComment( data.selectedMatch, $(this).val() );
		};

		this.setMapEnabled = function ( matchNumber, enabled ) {
			this.$mapEnabled[ matchNumber - 1 ].attr( 'checked', enabled );
		};

		this.setMap = function ( matchNumber, map ) {
			this.$map[ matchNumber - 1 ].val( map );
		};

		this.setMapwin = function ( matchNumber, mapwin ) {
			this.$mapwin[ matchNumber - 1 ].val( mapwin );
		};

		this.setVodgame = function ( matchNumber, vodgame ) {
			this.$vodgame[ matchNumber - 1 ].val( vodgame );
		};

		this.setDate = function ( date ) {
			this.$date.val( date );
		};

		this.setPreview = function ( preview ) {
			this.$preview.val( preview );
		};

		this.setLRThread = function ( lrthread ) {
			this.$lrthread.val( lrthread );
		};

		this.setInterview = function ( interview ) {
			this.$interview.val( interview );
		};

		this.setRecap = function ( recap ) {
			this.$recap.val( recap );
		};

		this.setComment = function ( comment ) {
			this.$comment.val( comment );
		};

		this.initUI = function () {
			//this.updateSelectedMatch( data.selectedMatch );
			this.$div.hide();
		};

		this.updateSelectedMatch = function ( selectedMatch ) {
			var flag1 = bm.getFlag( selectedMatch + '-1' ),
				flag2 = bm.getFlag( selectedMatch + '-2' ),
				race1 = bm.getRace( selectedMatch + '-1' ),
				race2 = bm.getRace( selectedMatch + '-2' );

			this.$player1Name.text( data.playerData.sure.name[ selectedMatch + '-1' ] );
			this.$player2Name.text( data.playerData.sure.name[ selectedMatch + '-2' ] );
			this.$player1Flag.bracketManager( 'setFlagImg', flag1 );
			this.$player2Flag.bracketManager( 'setFlagImg', flag2 );
			this.$player1Race.bracketManager( 'setRaceImg', race1 );
			this.$player2Race.bracketManager( 'setRaceImg', race2 );
			this.$isExtendedSeries.attr( 'checked', data.isExtendedSeries[ selectedMatch ] );

			for ( var i = 1; i <= 9; i++ ) {
				this.setMapEnabled( i, data.maps[ selectedMatch ][ i - 1 ].enabled );
				this.setMap( i, data.maps[ selectedMatch ][ i - 1 ].map );
				this.setMapwin( i, data.maps[ selectedMatch ][ i - 1 ].mapwin );
				this.setVodgame( i, data.maps[ selectedMatch ][ i - 1 ].vodgame );
			}
			this.setDate( data.matchDetails.date[ selectedMatch ] );
			this.setPreview( data.matchDetails.preview[ selectedMatch ] );
			this.setLRThread( data.matchDetails.lrthread[ selectedMatch ] );
			this.setInterview( data.matchDetails.interview[ selectedMatch ] );
			this.setRecap( data.matchDetails.recap[ selectedMatch ] );
			this.setComment( data.matchDetails.comment[ selectedMatch ] );
		};
	}

	mw.libs.bracketManager.classes.MatchDetails = MatchDetails;
}) ( mediaWiki, jQuery );