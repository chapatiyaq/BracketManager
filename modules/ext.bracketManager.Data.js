( function ( mw, $ ) {
	function Data () {
		// Player data
		this.playerData = {
			list: {},
			sure: {},
			computed: {}
		};

		// Results
		this.results = {
			score: {},
			score2: {},
			isWinner: {},
			invisibleWinner: {},
			loserPos: {},
			winnerPos: {}
		};

		// Match details
		this.matchDetails = {
			date: {},
			preview: {},
			lrthread: {},
			interview: {},
			recap: {},
			comment: {}
		};

		// Flow
		this.flow = {
			sources: {},
			loserTargets: {},
			winnerTargets: {},
			raceFlagTargets: {}
		};

		// Indexed by listIndex
		this.bracketPositions = [];

		// Indexed by bracket position
		this.listIndex = {};

		// Other
		this.players = [];
		this.allMatches = [];
		this.matchesWithAListMember = [];
		this.columnWidths = {};
		this.hideroundtitles = false;
		this.roundTitles = {};
	}

	mw.libs.bracketManager.classes.Data = Data;
})( mediaWiki, jQuery );