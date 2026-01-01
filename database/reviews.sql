-- Complete database schema for Smart Service Booking
-- Run this in phpMyAdmin

-- 1. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    professional_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_professional_id (professional_id),
    INDEX idx_user_id (user_id),
    INDEX idx_booking_id (booking_id)
);

-- 2. Add rating column to professionals table if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'professionals';
SET @columnname = 'rating';

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT "Column rating already exists in professionals table" AS Status;',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(3,2) DEFAULT 4.5 AFTER experience_years;')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add missing columns to bookings table
SET @tablename = 'bookings';

-- Add assigned_at if missing
SET @columnname = 'assigned_at';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT "Column assigned_at already exists in bookings table" AS Status;',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL DEFAULT NULL AFTER professional_id;')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add updated_at if missing
SET @columnname = 'updated_at';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT "Column updated_at already exists in bookings table" AS Status;',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Verify all tables
SHOW TABLES;

-- 5. Show structure of key tables
DESCRIBE reviews;
DESCRIBE professionals;
DESCRIBE bookings;