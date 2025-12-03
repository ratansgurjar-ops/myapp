-- SQL schema for Typing Tutor persistence
-- Run this against your MySQL database (replace `your_database_name` if needed)

CREATE TABLE IF NOT EXISTS `typing_shared` (
  `id` VARCHAR(191) NOT NULL,
  `title` TEXT,
  `text` LONGTEXT,
  `category` VARCHAR(32) NOT NULL DEFAULT 'practice',
  `visible` TINYINT(1) NOT NULL DEFAULT 0,
  `savedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_savedAt` (`savedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `typing_user_exercises` (
  `id` VARCHAR(191) NOT NULL,
  `username` VARCHAR(191) NOT NULL,
  `title` TEXT,
  `text` LONGTEXT,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `typing_users` (
  `username` VARCHAR(191) NOT NULL,
  `displayName` VARCHAR(191),
  `lastSaved` DATETIME DEFAULT NULL,
  `exerciseCount` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: a small migration helper to import existing JSON files into the DB can be added as a node script.
