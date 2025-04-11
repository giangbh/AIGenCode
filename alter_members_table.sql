-- Add role column to members table
ALTER TABLE members 
ADD COLUMN role text NOT NULL DEFAULT 'member' 
CHECK (role IN ('member', 'admin'));

-- Set initial admin (Giang) - change as needed
UPDATE members
SET role = 'admin'
WHERE name = 'Giang'; 