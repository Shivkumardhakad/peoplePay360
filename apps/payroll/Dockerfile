# Stage 1: Build Spring Boot JAR with Maven & Java 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

# Copy root pom and payroll module
COPY pom.xml .
COPY apps/payroll/pom.xml apps/payroll/pom.xml
COPY apps/payroll/src apps/payroll/src

# Build package skipping tests
RUN mvn -f apps/payroll/pom.xml clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /workspace/apps/payroll/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
