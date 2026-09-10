SELECT "Id", "UserName", "Email",
       CASE WHEN "SecurityStamp" IS NULL THEN 'NULL' ELSE 'OK' END AS stamp_status,
       CASE WHEN "ConcurrencyStamp" IS NULL THEN 'NULL' ELSE 'OK' END AS concurrency_status
  FROM "AspNetUsers"
 ORDER BY "UserName";
