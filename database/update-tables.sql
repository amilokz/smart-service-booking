-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN name VARCHAR(100) AFTER email,
ADD COLUMN phone VARCHAR(20) AFTER name,
ADD COLUMN address TEXT AFTER phone,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price DECIMAL(10, 2),
    duration_minutes INT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    booking_date DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    address TEXT,
    special_instructions TEXT,
    total_price DECIMAL(10, 2),
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Create professionals table
CREATE TABLE IF NOT EXISTS professionals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    service_id INT,
    experience_years INT,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    professional_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (professional_id) REFERENCES professionals(id)
);

-- Insert sample services
INSERT INTO services (name, description, category, price, duration_minutes, icon) VALUES
('Plumbing', 'Expert plumbing services including leak repair, pipe installation, and drainage solutions', 'home', 2500, 120, 'fa-faucet'),
('Cleaning', 'Professional residential and commercial cleaning services', 'home', 2000, 180, 'fa-broom'),
('Car Wash', 'Complete car washing and detailing services at your location', 'automotive', 1500, 90, 'fa-car'),
('Electrical', 'Certified electrical services for homes and offices', 'home', 3000, 120, 'fa-bolt'),
('HVAC', 'Heating, ventilation, and air conditioning services', 'home', 4000, 180, 'fa-wind'),
('Pest Control', 'Safe and effective pest elimination services', 'home', 3500, 120, 'fa-bug'),
('Carpentry', 'Professional woodworking and furniture repair', 'home', 2800, 150, 'fa-hammer'),
('Painting', 'Interior and exterior painting services', 'home', 5000, 240, 'fa-paint-roller'),
('Appliance Repair', 'Repair of home appliances and electronics', 'home', 2200, 120, 'fa-tools'),
('Gardening', 'Landscaping and gardening services', 'outdoor', 1800, 120, 'fa-leaf');

-- Insert sample professionals
INSERT INTO professionals (name, email, phone, service_id, experience_years, rating, total_reviews) VALUES
('Ali Khan', 'ali.khan@example.com', '+923001234567', 1, 5, 4.8, 124),
('Sara Ahmed', 'sara.ahmed@example.com', '+923002345678', 2, 3, 4.5, 89),
('Usman Malik', 'usman.malik@example.com', '+923003456789', 3, 4, 4.7, 156),
('Fatima Raza', 'fatima.raza@example.com', '+923004567890', 4, 6, 4.9, 203),
('Bilal Hassan', 'bilal.hassan@example.com', '+923005678901', 5, 8, 4.6, 178),
('Zainab Shah', 'zainab.shah@example.com', '+923006789012', 6, 4, 4.4, 92);