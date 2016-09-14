( function ( mw, $ ) {
	
	function CodeFunctions() {
		this.codeLine = function ( code ) {
			return mw.html.element( 'div', 
				{ 'class': 'pLine' },
				new mw.html.Raw( code )
			);
		};

		this.templateBrackets = function ( type ) {
			return mw.html.element( 'span',
				{ 'class': 'bm-template-brackets ' + type },
				type == 'close' ? '}}' : '{{'
			);
		};

		this.templateTitle = function ( title ) {
			return mw.html.element( 'span',
				{ 'class': 'bm-template-title' },
				title
			);
		};

		this.parameterHead = function ( text ) {
			return mw.html.element( 'span',
				{ 'class': 'bm-parameter-head' },
				text + '='
			);
		};
		
		this.parameterValue = function ( text ) {
			return mw.html.element( 'span',
				{ 'class': 'bm-parameter-value' },
				text
			);
		};
		
		this.parameterHeadAndValue = function ( head, value ) {
			return this.parameterHead( head ) + this.parameterValue( value );
		};
		
		this.tableBrackets = function ( type ) {
			return mw.html.element( 'span',
				{ 'class': 'bm-table-brackets ' + type },
				type == 'close' ? '|}' : '{|'
			);
		};
		
		this.tableDelimiter = function () {
			return mw.html.element( 'span',
				{ 'class': 'bm-table-delimiter' },
				'|'
			);
		};
		
		this.template = function ( title, params ) {
			var v,
				s = this.templateBrackets( 'open' ) + this.templateTitle( title );
			if ( params !== undefined && ! $.isEmptyObject( params ) ) {
				for ( var param in params ) {
					s += '|';
					v = params[param];
					if ( param.charAt( 0 ) != '@' )
						s += this.parameterHead( param );
					s += this.parameterValue( v );
				}
			}
			s += this.templateBrackets( 'close' );
			return s;
		};
		
		this.tableCell = function ( attribs, content ) {
			var v,
				s = this.tableDelimiter();
			if ( attribs !== undefined && ! $.isEmptyObject( attribs ) ) {
				for ( var attrib in attribs ) {
					v = attribs[attrib];
					s += this.parameterHead( attrib );
					s += this.parameterValue( v );
					s += mw.html.escape( ' ' );
				}
				s += this.tableDelimiter();
			}
			s += mw.html.escape( ' ' );
			s += content;
			return s;
		};
	}

	mw.libs.bracketManager.classes.CodeFunctions = CodeFunctions;
}) ( mediaWiki, jQuery );