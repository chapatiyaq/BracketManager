<?php
class ApiBracketManager extends ApiBase {
	private $BracketManagerListModuleNames;

	private $BracketManagerListModules = array(
		'racialdistribution' => 'bmRacialDistribution'
	);

	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );

		$this->BracketManagerListModuleNames = array_keys( $this->BracketManagerListModules );
	}

	public function execute() {
		$params = $this->extractRequestParams();

		$callback = $this->BracketManagerListModules[ $params['op'] ];

		$this->getResult()->addValue( null, $this->getModuleName()
			, array( $params['op'] => $this->$callback( $params ) )
		);
		//$callback( $params );
	}

	private function bmRacialDistribution( $params ) {
		$data = array();
        $dbr = wfGetDB( DB_SLAVE );
        $row = $dbr->selectRow(
            'bm_brackets',
            array( 'name', 'racialDistribution' ),
            'name = "' . $params['bracket'] . '"',
            __METHOD__
        );
        if ( $row ) {
            $data = json_decode( $row->racialDistribution );
        }

        return $data;
	}

	public function getDescription() {
		return 'Get some bracket manager things.';
	}

	public function getAllowedParams() {
		return array(
			'op' => array (
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => $this->BracketManagerListModuleNames
			),
			'bracket' => array (
				ApiBase::PARAM_TYPE => 'string'
			)
		);
	}

	public function getParamDescription() {
		return array(
			'op' => 'Type of operation required to be performed.',
			'bracket' => 'Bracket to obtain information for.'
		);
	}

	public function getVersion() {
		return __CLASS__ . ': $Id$';
	}
}
?>