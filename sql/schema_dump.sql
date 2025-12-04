-- Schema dump for StudyGK app
-- Run on your MySQL server (e.g., Hostinger) to create required database and tables

CREATE DATABASE IF NOT EXISTS `study_gk` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `study_gk`;

-- Questions table
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_english` TEXT,
  `question_hindi` TEXT,
  `options_1_english` TEXT,
  `options_2_english` TEXT,
  `options_3_english` TEXT,
  `options_4_english` TEXT,
  `options_1_hindi` TEXT,
  `options_2_hindi` TEXT,
  `options_3_hindi` TEXT,
  `options_4_hindi` TEXT,
  `answer` TEXT,
  `category` VARCHAR(128),
  `chapter_name` VARCHAR(128),
  `solution` TEXT,
  `slug` VARCHAR(255),
  `hits` INT DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` TINYINT(1) DEFAULT 1,
  `flags_count` INT DEFAULT 0,
  `feedback_count` INT DEFAULT 0,
  UNIQUE KEY `unique_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- News table (also used for advertisements; `type` distinguishes them)
CREATE TABLE IF NOT EXISTS `news` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255),
  `content` TEXT,
  `image` VARCHAR(512),
  `link` VARCHAR(512),
  `slug` VARCHAR(255),
  `tags` TEXT,
  `hits` INT DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` VARCHAR(32) DEFAULT 'news',
  `active` TINYINT(1) DEFAULT 1,
  UNIQUE KEY `unique_slug_news` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feedbacks table (feedback for questions)
CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `content` TEXT,
  `resolved` TINYINT(1) DEFAULT 0,
  `resolved_by` VARCHAR(255) DEFAULT NULL,
  `resolvedAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visits table
CREATE TABLE IF NOT EXISTS `visits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ip` VARCHAR(64),
  `path` VARCHAR(255),
  `user_agent` VARCHAR(512),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `secret_question` VARCHAR(255) DEFAULT 'first_school_name',
  `secret_answer_hash` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin reset tokens
CREATE TABLE IF NOT EXISTS `admin_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Typing tutor related tables
CREATE TABLE IF NOT EXISTS `typing_shared` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255),
  `text` LONGTEXT,
  `category` VARCHAR(32) DEFAULT 'practice',
  `visible` TINYINT(1) DEFAULT 1,
  `savedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `typing_user_exercises` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255),
  `text` LONGTEXT,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `typing_users` (
  `username` VARCHAR(128) PRIMARY KEY,
  `displayName` VARCHAR(255),
  `lastSaved` DATETIME DEFAULT NULL,
  `exerciseCount` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: create a sample admin user (change email/password hash accordingly)
-- INSERT INTO `admins` (`email`, `password_hash`) VALUES ('admin@example.com', '<bcrypt-hash>');

-- Done
