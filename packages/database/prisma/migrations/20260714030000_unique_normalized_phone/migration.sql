WITH normalized AS (
  SELECT
    "id",
    NULLIF(regexp_replace("phone", '[^0-9]', '', 'g'), '') AS normalized_phone,
    ROW_NUMBER() OVER (
      PARTITION BY NULLIF(regexp_replace("phone", '[^0-9]', '', 'g'), '')
      ORDER BY "createdAt", "id"
    ) AS duplicate_number
  FROM "User"
)
UPDATE "User"
SET "phone" = CASE
  WHEN normalized.normalized_phone IS NULL OR normalized.duplicate_number > 1 THEN NULL
  ELSE normalized.normalized_phone
END
FROM normalized
WHERE "User"."id" = normalized."id";

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
