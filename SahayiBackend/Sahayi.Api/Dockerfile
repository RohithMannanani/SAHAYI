# Multi-stage build for ASP.NET Core Web API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["Sahayi.Api.csproj", "./"]
RUN dotnet restore "Sahayi.Api.csproj"

# Copy full source and publish
COPY . .
RUN dotnet publish "Sahayi.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Sahayi.Api.dll"]
