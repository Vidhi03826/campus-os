# =========================
# BUILD STAGE
# =========================
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests


# =========================
# RUNTIME STAGE
# =========================
FROM eclipse-temurin:17-jre

LABEL org.opencontainers.image.source="https://github.com/Vidhi03826/campus-os"

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /app/uploads/resumes \
    && useradd --system --create-home campusos

RUN chown -R campusos:campusos /app

USER campusos

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]