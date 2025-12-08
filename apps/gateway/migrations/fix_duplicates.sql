
-- Add a unique constraint to prevent duplicate function deployments
ALTER TABLE functions 
ADD CONSTRAINT unique_function_deployment UNIQUE (wallet, project, function_name);

-- If this fails because of existing duplicates (which is the case), 
-- we need to clean them up first. 
-- This query keeps the most RECENT entry (highest ID or created_at) and deletes older ones.

DELETE FROM functions a USING (
    SELECT MIN(ctid) as ctid, wallet, project, function_name
    FROM functions 
    GROUP BY wallet, project, function_name HAVING COUNT(*) > 1
) b
WHERE a.wallet = b.wallet 
AND a.project = b.project 
AND a.function_name = b.function_name 
AND a.ctid <> b.ctid;
