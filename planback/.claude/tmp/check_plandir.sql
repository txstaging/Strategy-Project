SELECT pd."Id", pd."PlanId", pd."UnitId" AS "PlanDirectionUnitId",
       p."UnitId" AS "PlanUnitId",
       u."Name" AS "UnitName"
  FROM "PlanDirections" pd
  JOIN "Plans" p ON p."Id" = pd."PlanId"
  LEFT JOIN "Units" u ON u."Id" = pd."UnitId"
 ORDER BY pd."Id";
