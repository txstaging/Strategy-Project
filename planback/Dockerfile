# syntax=docker/dockerfile:1

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore first so package downloads are cached until a .csproj changes
COPY Mod.Core/Mod.Core.csproj Mod.Core/
COPY Mod.Repository/Mod.Repository.csproj Mod.Repository/
COPY Mod.Service/Mod.Service.csproj Mod.Service/
COPY Mod.APIs/Mod.APIs.csproj Mod.APIs/
RUN dotnet restore Mod.APIs/Mod.APIs.csproj

COPY . .
RUN dotnet publish Mod.APIs/Mod.APIs.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# Self-contained executable that applies pending EF Core migrations
RUN dotnet tool install --global dotnet-ef --version 9.0.*
ENV PATH="$PATH:/root/.dotnet/tools"
RUN dotnet ef migrations bundle \
      --project Mod.Repository/Mod.Repository.csproj \
      --startup-project Mod.APIs/Mod.APIs.csproj \
      --configuration Release \
      --output /app/efbundle

# ---------- migrator (run once before the API starts) ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS migrator
WORKDIR /app
# The bundle boots Program.Main, which loads wwwroot/Fonts, so it needs the published app next to it
COPY --from=build /app/publish .
COPY --from=build /app/efbundle ./efbundle
USER $APP_UID
ENTRYPOINT ["./efbundle"]

# ---------- api ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS api
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=8080
COPY --from=build /app/publish .
# Uploads are written at runtime by the non-root app user (mounted as a volume in compose)
RUN mkdir -p wwwroot/Uploads && chown -R $APP_UID:$APP_UID wwwroot/Uploads
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Mod.APIs.dll"]
