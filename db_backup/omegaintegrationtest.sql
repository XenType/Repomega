CREATE DATABASE  IF NOT EXISTS `omegaintegrationtest` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `omegaintegrationtest`;
-- MySQL dump 10.13  Distrib 8.0.17, for Win64 (x86_64)
--
-- Host: localhost    Database: omegaintegrationtest
-- ------------------------------------------------------
-- Server version	8.0.17

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `test_basic`
--

DROP TABLE IF EXISTS `test_basic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_basic` (
  `test_basic_id` int(11) NOT NULL AUTO_INCREMENT,
  `test_basic_string` varchar(50) NOT NULL,
  `test_basic_number` int(11) NOT NULL,
  `test_basic_date` datetime NOT NULL,
  `test_basic_null` varchar(50) DEFAULT NULL,
  `test_basic_internal` varchar(50) DEFAULT NULL,
  `test_basic_locked` varchar(50) DEFAULT NULL,
  `test_basic_password` varchar(50) DEFAULT NULL,
  `test_basic_boolean` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`test_basic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1194 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_basic`
--

LOCK TABLES `test_basic` WRITE;
/*!40000 ALTER TABLE `test_basic` DISABLE KEYS */;
INSERT INTO `test_basic` VALUES (53,'update',3,'2019-09-08 21:30:51',NULL,NULL,NULL,NULL,0),(54,'update',3,'2019-09-08 21:30:51',NULL,NULL,NULL,NULL,0),(55,'update',3,'2019-09-08 21:30:51',NULL,NULL,NULL,NULL,0),(56,'skip',2,'2019-12-23 00:00:00',NULL,NULL,NULL,NULL,0),(888,'abcd',5,'2019-09-01 00:05:31',NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `test_basic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_company`
--

DROP TABLE IF EXISTS `test_company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_company` (
  `test_company_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `test_market_id` int(11) NOT NULL,
  PRIMARY KEY (`test_company_id`),
  UNIQUE KEY `test_company_id_UNIQUE` (`test_company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=607 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_company`
--

LOCK TABLES `test_company` WRITE;
/*!40000 ALTER TABLE `test_company` DISABLE KEYS */;
INSERT INTO `test_company` VALUES (584,'New Company',8281),(585,'New Company',8296),(586,'New Company',8311),(587,'New Company',8326);
/*!40000 ALTER TABLE `test_company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_group`
--

DROP TABLE IF EXISTS `test_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_group` (
  `test_group_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_name` varchar(50) NOT NULL,
  PRIMARY KEY (`test_group_id`),
  UNIQUE KEY `test_group_id_UNIQUE` (`test_group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_group`
--

LOCK TABLES `test_group` WRITE;
/*!40000 ALTER TABLE `test_group` DISABLE KEYS */;
INSERT INTO `test_group` VALUES (1,'Group One'),(2,'Group Two'),(3,'Group Three');
/*!40000 ALTER TABLE `test_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_market`
--

DROP TABLE IF EXISTS `test_market`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_market` (
  `test_market_id` int(11) NOT NULL AUTO_INCREMENT,
  `market_name` varchar(50) NOT NULL,
  `currency` varchar(5) NOT NULL,
  PRIMARY KEY (`test_market_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8622 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_market`
--

LOCK TABLES `test_market` WRITE;
/*!40000 ALTER TABLE `test_market` DISABLE KEYS */;
/*!40000 ALTER TABLE `test_market` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_user`
--

DROP TABLE IF EXISTS `test_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_user` (
  `test_user_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `last_rating` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_type` varchar(10) NOT NULL,
  `password` varchar(255) NOT NULL,
  `company_id` int(11) NOT NULL,
  PRIMARY KEY (`test_user_id`),
  UNIQUE KEY `test_user_id_UNIQUE` (`test_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_user`
--

LOCK TABLES `test_user` WRITE;
/*!40000 ALTER TABLE `test_user` DISABLE KEYS */;
INSERT INTO `test_user` VALUES (1,'Test','User',NULL,'2019-08-27 20:08:58','demo','abcdefg',1);
/*!40000 ALTER TABLE `test_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_user_group_link`
--

DROP TABLE IF EXISTS `test_user_group_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_user_group_link` (
  `test_user_id` int(11) NOT NULL,
  `test_group_id` int(11) NOT NULL,
  PRIMARY KEY (`test_user_id`,`test_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_user_group_link`
--

LOCK TABLES `test_user_group_link` WRITE;
/*!40000 ALTER TABLE `test_user_group_link` DISABLE KEYS */;
/*!40000 ALTER TABLE `test_user_group_link` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_user_value_link`
--

DROP TABLE IF EXISTS `test_user_value_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_user_value_link` (
  `test_uesr_id` int(11) NOT NULL,
  `test_value_id` int(11) NOT NULL,
  PRIMARY KEY (`test_uesr_id`,`test_value_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_user_value_link`
--

LOCK TABLES `test_user_value_link` WRITE;
/*!40000 ALTER TABLE `test_user_value_link` DISABLE KEYS */;
/*!40000 ALTER TABLE `test_user_value_link` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_value`
--

DROP TABLE IF EXISTS `test_value`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_value` (
  `test_value_id` int(11) NOT NULL AUTO_INCREMENT,
  `test_group_id` int(11) NOT NULL,
  `value` varchar(50) NOT NULL,
  PRIMARY KEY (`test_value_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_value`
--

LOCK TABLES `test_value` WRITE;
/*!40000 ALTER TABLE `test_value` DISABLE KEYS */;
/*!40000 ALTER TABLE `test_value` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-09-08 21:40:58
