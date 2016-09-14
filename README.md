This project is unfinished, but mostly functional, with maybe some bugs. Some files and parts of the code may not be useful but were a step towards an unfinished functionality.

# Installation

Download and place the files in a directory called BracketManager in the extensions/ folder of your MediaWiki installation.

Add the following code at the bottom of your LocalSettings.php:
`require_once "$IP/extensions/BracketManager/BracketManager.php";`

Note: this extension does not use the method used since MediaWiki 1.25. You may need to adapt the code if you want to use this extension with the latest MediaWiki versions.