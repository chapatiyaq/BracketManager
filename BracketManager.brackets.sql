CREATE TABLE IF NOT EXISTS `bm_brackets` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `type` varchar(63) NOT NULL,
  `numberOfPlayers` int(11) NOT NULL,
  `thirdplacematch` tinyint(1) NOT NULL,
  `listNameParameters` text NOT NULL,
  `bracketPositionToParameter` text NOT NULL,
  `racialDistribution` text NOT NULL,
  PRIMARY KEY (`id`)
);