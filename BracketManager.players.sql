CREATE TABLE IF NOT EXISTS `bm_players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `flag` varchar(2) NOT NULL,
  `race` char(1) NOT NULL,
  `tlpd` varchar(255) NOT NULL,
  `tsModif` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tlpd` (`tlpd`)
);