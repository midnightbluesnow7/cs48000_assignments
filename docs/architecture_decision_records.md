# ADR 001: Architectural Foundation for SteelWorks Operations Data Hub

## Status
**Accepted**

---

## Context
SteelWorks, LLC currently manages operational data across three disconnected spreadsheets: **Production Logs (CSV)**, **Quality Inspections (XLSX/CSV)**, and **Shipping Logs (XLSX)**. An Operations Analyst needs an integrated view to track Lot IDs, identify production errors, and verify shipment status without manual data merging.

Key requirements include automated multi-source ingestion (AC 1), data normalization via composite keys (AC 2), integrated problem reporting (AC 3), and automated validation/exception handling (AC 4).



---

## Decisions

### 1. System Roles & Communication: Option A (Client–Server)

* **Reasoning:** To meet the user story's requirement for "timely" answers and "immediate" status returns, a direct Request-Response model is ideal. The Client (Analyst's browser) makes a request, and the Server (SteelWorks API) queries the database to return the latest Production or Shipping status.
* **Alternatives Considered:** **Option B (Event-Driven Architecture)** was considered but rejected because our data source is static spreadsheets rather than a high-frequency stream of IoT sensor data. Introducing a message broker like RabbitMQ would add unnecessary infrastructure complexity.
* **Consequences (Positive):** Simple implementation, low latency for search queries, and easier debugging for a junior engineer.
* **Consequences (Negative):** The server must be online for the client to function; it lacks the decoupled resilience of an event-based system.

### 2. Deployment & Evolution: Option A (Monolith)

* **Reasoning:** Since this is a "small, integrated web application," a monolith allows us to manage the ingestion, normalization, and UI logic in a single codebase. This makes it much easier to ensure that the "Cleansing Logic" (AC 2) is applied consistently across all three data sources before they are joined.
* **Alternatives Considered:** **Option B (Microservices)** was rejected because the core requirement is "Data Consolidation." Splitting the app into separate "Production" and "Shipping" services would make performing the relational mapping (AC 2) and identifying inconsistencies (AC 4) significantly harder due to distributed data.
* **Consequences (Positive):** Simplified deployment, easier cross-functional data joins, and lower infrastructure costs.
* **Consequences (Negative):** If one component (like the XLSX parser) consumes too much memory, it could potentially slow down the entire dashboard for the user.

### 3. Code Organization: Option A (Layered Architecture)

* **Reasoning:** This structure allows us to isolate the "messy" work of AC 1 and AC 2. We can have a **Data Access Layer** dedicated to SharePoint ingestion, a **Service Layer** for the regex-based normalization (trimming zeros/standardizing dates), and a **Presentation Layer** for the AC 3 reporting visuals.
* **Alternatives Considered:** **Option B (Feature-Based Architecture)** was considered but rejected. In this specific app, the "features" (Production, Quality, Shipping) are not independent—they are tightly coupled by the Lot ID. Splitting them into separate feature folders would lead to significant code duplication in the normalization logic.
* **Consequences (Positive):** High maintainability; if the Quality team changes their file format, you only change the Data Access layer.
* **Consequences (Negative):** Can lead to "sinkhole" patterns where simple requests must pass through multiple layers that don't add much logic.

### 4. Data & State Ownership: Option A (Single Database)

* **Reasoning:** A single relational database is the most effective way to handle the composite key (Lot ID + Date) required by AC 2. It allows for "Foreign Key" relationships that can automatically flag if a Lot exists in Shipping but is missing from Quality (AC 4) using simple SQL queries.
* **Alternatives Considered:** **Option B (Database per Service)** was rejected. Because the Analyst needs an "integrated view," having data in separate databases would require "Application-Level Joins," which are significantly slower and harder to write than standard SQL joins.
* **Consequences (Positive):** Strong data consistency, easy implementation of the "Search" function, and a single source of truth for "Source Health" timestamps.
* **Consequences (Negative):** The database becomes a single point of failure; if it goes down, the entire application is offline.



### 5. Interaction Model: Option A (Synchronous)

* **Reasoning:** The Analyst expects the "Search" function to return results "immediately." A synchronous model ensures that when the user searches for a Lot ID, the connection remains open until the data is fetched and displayed.
* **Alternatives Considered:** **Option B (Asynchronous)** was considered for the daily data refresh (AC 1). While the *ingestion* could be async, the *interaction* for the Analyst needs to be sync to meet the "timely manner" requirement of the user story.
* **Consequences (Positive):** Much simpler UI logic (no need for "Loading" spinners or "Job Complete" notifications) and a more intuitive user experience.
* **Consequences (Negative):** If the spreadsheet files become massive (e.g., hundreds of thousands of rows), the "refresh on open" might cause the browser to hang or timeout.