-- Promote a user to admin by email (run in Neon SQL Editor).
-- Replace the email below if needed.

UPDATE "User"
SET "role" = 'ADMIN'::"UserRole", "updatedAt" = NOW()
WHERE LOWER("email") = LOWER('kian.winwood1@gmail.com');
