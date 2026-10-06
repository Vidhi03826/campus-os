# CampusOS

### Full-Stack Campus Recruitment & Placement Management Platform

CampusOS is a production-oriented full-stack recruitment platform designed to manage the complete campus hiring lifecycle for **students, recruiters, and administrators**.

It combines a modern React frontend with a secure Spring Boot REST API, relational persistence, JWT-based authentication, role-based authorization, application workflow management, resume handling, notifications, automated testing, API documentation, containerization, and CI foundations.

> **Project status:** Core recruitment platform completed. Production-hardening, intelligent matching, analytics, deployment, and advanced platform capabilities are part of the ongoing roadmap.

---

## ✨ Why CampusOS?

Most campus-placement projects stop at:

```text
Login → Jobs → Apply → Database
```

CampusOS is designed around the complete recruitment workflow:

```text
                    ┌───────────────────┐
                    │      CampusOS     │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
          Students         Recruiters        Admins
              │               │                │
              ▼               ▼                ▼
        Discover Jobs    Create Jobs       Manage Users
              │               │
              ▼               ▼
        Apply to Jobs     Review Applicants
              │               │
              ▼               ▼
       Track Applications  Update Status
              │               │
              └───────┬───────┘
                      ▼
               Notifications
```

The platform is built with an emphasis on **security, maintainability, API design, validation, state transitions, testing, and deployment readiness** rather than only UI functionality.

---

# 🚀 Core Features

## 👨‍🎓 Student Portal

### Authentication & Profile
- Secure registration and login
- JWT-based authentication
- Refresh-token lifecycle
- Role-based access control
- Student profile management
- Skills management

### Job Discovery
- Browse published jobs
- Search jobs
- Filter jobs
- Sort jobs
- Pagination
- View complete job details
- Save and unsave jobs

### Applications
- Apply to jobs
- Prevent duplicate applications
- Track application status
- View application details
- View application history
- Withdraw eligible applications
- Receive application-status notifications

### Resume
- Upload resume
- Resume validation
- View resume metadata
- Authenticated resume download
- Delete resume

---

# 🏢 Recruiter Portal

Recruiters can manage the hiring workflow from a centralized dashboard.

### Job Management
- Create jobs
- Edit jobs
- Publish/unpublish jobs
- Configure job type
- Configure work mode
- Set experience requirements
- Set salary ranges
- Set application deadlines

### Applicant Management

Recruiters can:

- View applicants for a specific job
- Review applicant information
- Track application status
- Progress candidates through the hiring pipeline
- Reject candidates
- View recruitment activity

---

# 🛡️ Admin Portal

Administrative capabilities are protected through role-based authorization.

The platform supports administrative workflows for:

- User management
- Role management
- Recruiter management
- Protected administrative operations
- Platform-level analytics/workflows

---

# 🔄 Application Lifecycle

CampusOS models recruitment as an explicit state machine.

```text
                         ┌──────────────┐
                         │    APPLIED   │
                         └──────┬───────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │   UNDER_REVIEW   │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │   SHORTLISTED    │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │    INTERVIEW     │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │     SELECTED     │
                      └──────────────────┘
```

Applications may also transition to:

```text
REJECTED
WITHDRAWN
```

Invalid transitions are rejected by the backend rather than being trusted to the frontend.

This keeps the recruitment workflow consistent regardless of which client calls the API.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │       Browser        │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP / JSON
                                    ▼
                         ┌──────────────────────┐
                         │    React + Vite      │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                                  Axios
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │       Spring Boot API        │
                    │                              │
                    │ Controllers                  │
                    │ Services                     │
                    │ Validation                   │
                    │ Security                     │
                    │ Exception Handling            │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
                ┌───────┐      ┌───────┐    ┌──────────┐
                │ MySQL │      │ Redis │    │ Storage  │
                └───────┘      └───────┘    └──────────┘
```

---

# 🧱 Backend Architecture

CampusOS follows a layered architecture:

```text
┌─────────────────────────┐
│       Controllers       │
│   HTTP / API boundary   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│        Services         │
│ Business logic / rules  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      Repositories       │
│   Data access layer     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│         MySQL           │
│     Persistent data     │
└─────────────────────────┘
```

Supporting layers include:

```text
Security
DTOs
Validation
Exception Handling
Configuration
Storage
Caching
```

This separation keeps business logic independent from HTTP and persistence concerns.

---

# 🔐 Security Architecture

CampusOS uses Spring Security with JWT-based authentication and role-based authorization.

Authentication flow:

```text
                Login Request
                     │
                     ▼
              Authentication
                     │
                     ▼
              Access Token
                     │
                     ▼
          Authorization Header
                     │
                     ▼
          JWT Authentication Filter
                     │
                     ▼
              Security Context
                     │
                     ▼
             RBAC / Ownership
                     │
                     ▼
             Protected API
```

Security mechanisms include:

- JWT authentication
- Access-token validation
- Refresh-token lifecycle
- Refresh-token rotation/revocation
- BCrypt password hashing
- Role-based authorization
- Protected endpoints
- Ownership checks
- Request validation
- Centralized exception handling
- CORS configuration
- Account security controls
- Environment-based secrets

Sensitive credentials are not intended to be stored in source control.

---

# 🔑 Authentication & Token Lifecycle

CampusOS separates short-lived access authentication from refresh-token based session continuation.

Conceptually:

```text
Login
  │
  ├──────────────► Access Token
  │
  └──────────────► Refresh Token
                         │
                         ▼
                 Access token expires
                         │
                         ▼
                  Refresh request
                         │
                         ▼
                Token validation
                         │
                         ▼
               Token rotation/reuse
                         │
                         ▼
                New access token
```

Refresh-token revocation and expiry are handled by the backend.

---

# 📡 REST API

The backend exposes REST APIs for:

```text
Authentication
Users
Students
Recruiters
Companies
Jobs
Applications
Application History
Saved Jobs
Skills
Resumes
Notifications
Administration
```

Representative endpoints:

```text
POST   /api/students/me/jobs/{jobId}/applications

GET    /api/students/me/applications

GET    /api/students/me/applications/{applicationId}

GET    /api/students/me/applications/{applicationId}/history

POST   /api/students/me/applications/{applicationId}/withdraw

GET    /api/recruiters/me/jobs/{jobId}/applications

PATCH  /api/recruiters/me/applications/{applicationId}/status

GET    /api/notifications

GET    /api/notifications/unread-count
```

The API uses DTOs to keep the public API contract separate from persistence entities.

---

# 🔔 Notification Architecture

Important recruitment events generate notifications for users.

Example:

```text
Recruiter
    │
    │ changes application status
    ▼
Application Service
    │
    ├──────────────► Update Application
    │
    ├──────────────► Record Status History
    │
    └──────────────► Create Notification
                              │
                              ▼
                           Student
```

Students can:

- View notifications
- View unread count
- Mark individual notifications as read
- Mark all notifications as read

---

# 📄 Resume Management

Resume handling is implemented as an authenticated backend workflow.

```text
Resume Upload
      │
      ▼
Validation
      │
      ▼
Storage
      │
      ▼
Metadata Persistence
      │
      ├──────────────► Download
      │
      └──────────────► Delete
```

Resume operations are associated with the authenticated student.

Downloads are performed through the authenticated API rather than relying on an unauthenticated public file URL.

---

# 🔎 Job Search & Pagination

Job discovery supports backend-side filtering and pagination.

Supported concepts include:

- Keyword search
- Location
- Job type
- Work mode
- Salary range
- Sorting
- Pagination

Example:

```text
GET /api/jobs

        │
        ├── keyword
        ├── location
        ├── jobType
        ├── workMode
        ├── salary
        ├── page
        ├── size
        └── sort
```

Pagination prevents unnecessarily loading the complete job dataset into memory.

---

# ⚡ Caching

CampusOS includes Redis/cache infrastructure for frequently accessed data.

The job-discovery layer is designed around cacheable published-job queries.

Conceptually:

```text
Client
  │
  ▼
Job API
  │
  ▼
Cache lookup
  │
  ├── HIT ───────► Return cached response
  │
  └── MISS
        │
        ▼
      MySQL
        │
        ▼
   Store in cache
        │
        ▼
   Return response
```

> Redis caching is currently part of the engineering audit/hardening phase. Cache invalidation, TTL strategy, failure behavior, and production readiness will be finalized before being considered complete.

---

# 🧪 Testing Strategy

CampusOS uses multiple testing layers instead of relying only on manual API testing.

## Unit Testing

Business services are tested independently using mocks where appropriate.

Examples include:

- Authentication behavior
- Application workflows
- User operations
- JWT-related logic

## Controller Testing

Controller tests verify:

- Request mapping
- HTTP status codes
- Request/response behavior
- Validation behavior

## Security Testing

Authorization behavior is tested for different authentication states and roles.

Example:

```text
No Authentication
       │
       ▼
      401

Authenticated User
       │
       ▼
Authorized Resource
       │
       ▼
      200

Authenticated User
       │
       ▼
Unauthorized Admin Resource
       │
       ▼
      403
```

## Integration Testing

Integration tests verify important security and application flows using the actual Spring Boot application context.

Run backend tests:

```powershell
.\mvnw.cmd test
```

---

# 📚 API Documentation

CampusOS uses **OpenAPI / Swagger** for interactive API documentation.

When the backend is running, Swagger UI can be accessed through the configured Springdoc endpoint.

Swagger makes it possible to:

- Explore REST endpoints
- Inspect request/response models
- Understand API contracts
- Authorize protected requests
- Test APIs interactively

---

# 🗄️ Data Model

The backend is organized around domain entities representing the recruitment lifecycle.

Core concepts include:

```text
User
 │
 ├── Student Profile
 │       │
 │       ├── Skills
 │       ├── Resume
 │       ├── Saved Jobs
 │       └── Applications
 │
 └── Recruiter Profile
         │
         └── Company
                │
                └── Jobs
                       │
                       └── Applications
                              │
                              ├── Status
                              ├── History
                              └── Notifications
```

Persistence is handled through Spring Data JPA and Hibernate with MySQL.

---

# 🧩 Frontend Architecture

The React frontend is organized into reusable layers:

```text
frontend/
│
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   └── styles/
```

The frontend uses:

- React
- Vite
- React Router
- Axios
- Context-based global state
- Reusable components
- API abstraction modules
- Centralized toast notifications
- Role-aware routing
- Responsive UI

Axios interceptors handle authentication-related request behavior.

---

# 🎨 UX & Frontend Engineering

The frontend includes dedicated experiences for:

```text
Student
Recruiter
Admin
```

Important UX states are handled through:

- Loading states
- Empty states
- Error states
- Success feedback
- Toast notifications
- Confirmation flows
- Disabled actions where appropriate
- Responsive layouts

The goal is to make backend workflows understandable from the user interface rather than exposing raw API behavior.

---

# 🐳 Containerization

CampusOS includes Docker configuration for reproducible environments.

Target architecture:

```text
┌───────────────────────────────┐
│          Docker Compose       │
│                               │
│  ┌──────────┐  ┌──────────┐  │
│  │ Backend  │  │  MySQL   │  │
│  │ Spring   │  │          │  │
│  │ Boot     │  │          │  │
│  └────┬─────┘  └──────────┘  │
│       │                       │
│       ▼                       │
│  ┌──────────┐                 │
│  │  Redis   │                 │
│  └──────────┘                 │
└───────────────────────────────┘
```

Build the containerized backend environment with:

```bash
docker compose up --build
```

---

# 🔄 CI

The repository contains GitHub Actions workflows for automated project checks.

The intended CI pipeline is:

```text
        git push
            │
            ▼
     GitHub Actions
            │
            ▼
      Build Project
            │
            ▼
       Run Tests
            │
            ▼
     Verify Changes
```

CI configuration is being progressively hardened as the project moves toward deployment.

---

# ⚙️ Configuration

Environment-specific configuration is externalized.

Use:

```text
.env.example
```

as the configuration template.

Typical configuration values include:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
JWT_SECRET
FRONTEND_URL
```

Never commit:

```text
.env
passwords
database credentials
JWT secrets
API keys
private tokens
```

---

# 💻 Local Development

## Prerequisites

Install:

- Java
- Node.js
- npm
- MySQL
- Git
- Docker Desktop (recommended)

---

## Backend

From the project root:

```powershell
.\mvnw.cmd spring-boot:run
```

---

## Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend development server:

```text
http://localhost:5173
```

---

## Build Frontend

```powershell
cd frontend
npm run build
```

---

## Run Tests

```powershell
.\mvnw.cmd test
```

---

# 📁 Project Structure

```text
campus-os/
│
├── .github/
│   └── workflows/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/vidhi/campusos/
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── dto/
│   │   │       ├── entity/
│   │   │       ├── exception/
│   │   │       ├── repository/
│   │   │       ├── security/
│   │   │       └── service/
│   │   │
│   │   └── resources/
│   │
│   └── test/
│
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── mvnw
├── mvnw.cmd
├── pom.xml
└── README.md
```

---

# 🧠 Engineering Decisions

## Layered Architecture

Business logic is separated from controllers and persistence to improve maintainability and testability.

## DTO Boundaries

DTOs prevent persistence entities from becoming the public API contract.

## JWT + RBAC

Authentication and authorization are handled explicitly at the API/security layer.

## Backend-Owned Business Rules

Critical rules such as application transitions and authorization are enforced on the backend rather than relying on frontend validation.

## Pagination

Large collections are paginated instead of returning unbounded datasets.

## Centralized Exception Handling

Errors are converted into consistent API responses.

## Environment-Based Configuration

Environment-specific values are externalized to keep secrets and deployment configuration outside source code.

## Automated Testing

Security and business workflows are tested at multiple levels.

---

# 📈 Current Project Status

### Completed Core Platform

- [x] Student authentication
- [x] Recruiter authentication
- [x] Admin authorization
- [x] JWT authentication
- [x] Refresh-token flow
- [x] Role-based access control
- [x] Student profiles
- [x] Recruiter profiles
- [x] Company management
- [x] Job management
- [x] Job discovery
- [x] Search and filtering
- [x] Pagination
- [x] Saved jobs
- [x] Job applications
- [x] Application lifecycle
- [x] Application history
- [x] Application withdrawal
- [x] Resume management
- [x] Notifications
- [x] Recruiter applicant management
- [x] Validation
- [x] Centralized exception handling
- [x] Swagger/OpenAPI foundation
- [x] Automated testing foundation
- [x] Docker configuration
- [x] GitHub Actions CI foundation

---

# 🚧 Roadmap

CampusOS is being developed in progressive engineering phases.

## Phase 1 — Production Engineering

- [ ] Redis cache hardening
- [ ] Cache invalidation strategy
- [ ] TTL strategy
- [ ] Database index optimization
- [ ] N+1 query audit
- [ ] Transaction boundary audit
- [ ] Security hardening
- [ ] File-upload security hardening
- [ ] Expanded integration tests
- [ ] CI reliability improvements
- [ ] Observability and structured logging

## Phase 2 — Platform & DevOps

- [ ] Production Docker setup
- [ ] CI/CD pipeline
- [ ] Cloud deployment
- [ ] Environment-specific deployment configuration
- [ ] Health checks
- [ ] Monitoring

## Phase 3 — Intelligent Recruitment

- [ ] AI-powered job matching
- [ ] Resume skill extraction
- [ ] Resume-to-job compatibility scoring
- [ ] Personalized job recommendations
- [ ] Skill-gap recommendations

## Phase 4 — Recruitment Analytics

- [ ] Recruiter application funnel
- [ ] Job-wise application analytics
- [ ] Selection metrics
- [ ] Student application analytics
- [ ] Recruitment trends

## Phase 5 — Frontend Excellence

- [ ] Accessibility audit
- [ ] Responsive design audit
- [ ] Loading/skeleton states
- [ ] Empty/error-state consistency
- [ ] Performance optimization
- [ ] Final UI/UX refinement

---

# 🎯 Long-Term Vision

CampusOS is intended to evolve from a traditional campus-placement portal into an intelligent recruitment platform.

```text
                  ┌─────────────────┐
                  │    CampusOS     │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       Students        Recruiters         Admin
          │                │
          ▼                ▼
       Resume            Jobs
          │                │
          └───────┬────────┘
                  ▼
           Matching Engine
                  │
                  ▼
        Personalized Opportunities
```

Future intelligence features will focus on:

- Candidate-job matching
- Resume intelligence
- Skill-gap analysis
- Personalized recommendations
- Recruitment analytics

The goal is to make CampusOS useful not only for **managing applications**, but also for **helping students discover better opportunities and helping recruiters discover relevant candidates**.

---

# 📊 What This Project Demonstrates

CampusOS demonstrates practical experience with:

```text
Java
Spring Boot
Spring Security
JWT
RBAC
Refresh Tokens
REST API Design
DTO Architecture
JPA / Hibernate
MySQL
Redis
React
Vite
React Router
Axios
JavaScript
HTML
CSS
Validation
Exception Handling
Pagination
Database Design
Automated Testing
Swagger / OpenAPI
Docker
Docker Compose
Git
GitHub
GitHub Actions
```

More importantly, the project demonstrates the ability to design a system around:

```text
Security
Scalability
Maintainability
API Contracts
Business Rules
Data Persistence
Testing
Deployment
User Experience
```

rather than treating the application as a collection of CRUD screens.

---

# 👩‍💻 Author

## Vidhi Nema

B.Tech — Information Technology  
Jabalpur Engineering College

Built as a full-stack engineering and learning project.

---

# ⭐ Project Philosophy

> Build features that are useful.  
> Enforce important rules on the backend.  
> Test critical workflows.  
> Keep architecture understandable.  
> Optimize only where there is a real bottleneck.  
> Add technology because it solves a problem — not because it looks good on a resume.

---