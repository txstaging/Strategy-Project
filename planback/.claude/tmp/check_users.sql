SELECT u."Id", u."UserName", u."UnitId",
       (SELECT string_agg(r."Name", ',')
          FROM "AspNetUserRoles" ur
          JOIN "AspNetRoles" r ON r."Id" = ur."RoleId"
         WHERE ur."UserId" = u."Id") AS roles
  FROM "AspNetUsers" u
 ORDER BY u."Id";
