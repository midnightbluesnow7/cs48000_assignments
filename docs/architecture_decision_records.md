# Architecture Decision Record: Campus Event Hub Foundation

## Title
Standardizing a Monolithic Client-Server Architecture for the Campus Event Hub 

**Status:** Accepted 

---

## Context

### System
* **Purpose:** A centralized hub to manage event submissions, reviews, searches, and promotions for students.

### Users
* Hundreds of student browsers, dozens of event organizers, and a few staff administrators.

### Resource Constraints
* Developed and maintained by a small team of **2–4 engineers** with a limited budget and low to moderate concurrent usage requirements.

### Maintenance Goals
* The system must be easy to extend with new features like email reminders without requiring major refactoring.

---

## Decision
To meet the requirements for simplicity and maintainability, the system will follow these five integrated architectural dimensions:



1.  **System Roles & Communication:** A **Client-Server model** where a web-based client interacts with a central server via an API.
2.  **Deployment & Evolution:** A **Modular Monolith** to manage one codebase and one deployment pipeline while keeping code organized by function.
3.  **Code Organization:** A **Layered Architecture** with distinct horizontal layers for Presentation, Business Logic, and Data Access.
4.  **Data & State Ownership:** A **Single Relational Database** (e.g., PostgreSQL or MySQL) to handle highly relational event data with ACID compliance.
5.  **Interaction Model:** **Synchronous request-response patterns** (REST or GraphQL) to provide immediate feedback for searches and submissions.

---

## Alternatives Considered

* **Event-Driven Architecture (EDA):** Rejected because the overhead of managing message brokers and eventual consistency exceeds the needs of a small student hub.
* **Microservices:** Rejected as it would introduce a "distributed systems tax," requiring complex service discovery and inter-service authentication that a team of 2–4 engineers cannot efficiently support.
* **Feature-Based Organization:** Rejected in favor of the layered approach because horizontal layers are easier for junior engineers to navigate and ensure strict dependency rules.
* **Database per Service:** Rejected as it complicates simple data joins (e.g., joining an event with its category) and requires complex data synchronization.
* **Asynchronous Interaction:** Rejected because submitting or approving text-based events takes only milliseconds; adding queues would unnecessarily complicate the frontend and frustrate users.

---

## Consequences

### Positive
* Provides a straightforward approach familiar to most developers, facilitating easier onboarding.
* Lowers infrastructure costs and operational complexity by utilizing a single application server and database.
* Ensures immediate data consistency for critical status changes like event approvals.
* Enables independent testing of layers, satisfying the requirement for easy maintenance and future extensibility.

### Negative
* The entire system must be redeployed to update a single component.
* A single database represents a single point of failure and a potential bottleneck if the user base grows significantly beyond expectations.
* Synchronous requests block the client until a response is received, which may need adjustment if long-running tasks are added later.
