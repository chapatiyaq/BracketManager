CREATE TABLE IF NOT EXISTS `bm_aliases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pid` int(11) NOT NULL,
  `alias` varchar(20) NOT NULL,
  `is_primary_name` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
);