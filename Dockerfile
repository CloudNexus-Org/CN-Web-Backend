# =========================
# 🔨 BUILD STAGE
# =========================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM eclipse-temurin:21-jre-alpine

# Update OS packages (important for security scans)
RUN apk update && apk upgrade && apk add --no-cache curl

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENTRYPOINT ["java", "-jar", "app.jar"]