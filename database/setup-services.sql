-- Complete Service Setup Script
-- 1. Disable all services first
UPDATE services SET is_active = 0;

-- 2. Activate and update only the services we want
UPDATE services SET 
    is_active = 1,
    category = CASE 
        WHEN name LIKE '%Plumb%' THEN 'home'
        WHEN name LIKE '%Electr%' THEN 'home'
        WHEN name LIKE '%Clean%' THEN 'cleaning'
        WHEN name LIKE '%Car Wash%' THEN 'automotive'
        WHEN name LIKE '%HVAC%' THEN 'home'
        WHEN name LIKE '%Pest%' THEN 'home'
        WHEN name LIKE '%AC Repair%' THEN 'home'
        ELSE 'other'
    END,
    icon = CASE
        WHEN name LIKE '%Plumb%' THEN 'fa-faucet'
        WHEN name LIKE '%Electr%' THEN 'fa-bolt'
        WHEN name LIKE '%Clean%' THEN 'fa-broom'
        WHEN name LIKE '%Car Wash%' THEN 'fa-car'
        WHEN name LIKE '%HVAC%' THEN 'fa-wind'
        WHEN name LIKE '%Pest%' THEN 'fa-bug'
        WHEN name LIKE '%AC Repair%' THEN 'fa-snowflake'
        ELSE 'fa-tools'
    END
WHERE id IN (11, 12, 13, 14, 15, 16);

-- 3. Delete duplicate services (keeping only one of each type)
DELETE s1 FROM services s1
INNER JOIN services s2 
WHERE 
    s1.id > s2.id AND 
    s1.name = s2.name AND
    s1.price = s2.price;

-- 4. Verify final services list
SELECT id, name, price, duration_minutes, icon, category, is_active 
FROM services 
WHERE is_active = 1 
ORDER BY category, name;