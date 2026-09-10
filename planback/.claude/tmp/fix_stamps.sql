UPDATE "AspNetUsers"
   SET "SecurityStamp"    = COALESCE("SecurityStamp",    REPLACE(UPPER(gen_random_uuid()::text), '-', '')),
       "ConcurrencyStamp" = COALESCE("ConcurrencyStamp", gen_random_uuid()::text)
 WHERE "SecurityStamp" IS NULL OR "ConcurrencyStamp" IS NULL;
