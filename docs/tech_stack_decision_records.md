# ADR 001: Selection of Tech Stack for OpsDashboard

## Title
Selection of Primary Development Stack for SteelWorks Operations Data Portal

## Status
**Accepted**

## Context
SteelWorks, LLC requires a centralized internal application to monitor real-time operations data, including inventory levels, shipping schedules, and factory floor sensor logs. As a junior engineer, I need a stack that balances:
* **Speed of Delivery:** Getting a functional MVP into the hands of plant managers quickly.
* **Data Centricity:** The ability to handle complex SQL queries and data visualizations effortlessly.
* **Maintainability:** Leveraging AI-assisted coding to overcome solo-developer bottlenecks.

## Decision
We will use **Stack A: Python + Streamlit + SQLAlchemy + PostgreSQL**.

This decision is driven by the "Data-First" nature of our operations. Streamlit allows us to treat the UI as a script, effectively removing the "frontend vs. backend" friction that usually slows down small-scale internal projects. Python’s dominance in data processing makes it the natural fit for manufacturing analytics.

## Alternatives Considered
* **Stack B (Spring Boot + Thymeleaf + JPA):** Rejected for this phase. While "industrial-strength," the configuration overhead and boilerplate code would delay our first release by weeks. It is better suited for high-transaction customer-facing portals than internal dashboards.
* **Stack C (Node.js + Express + EJS):** A strong runner-up. However, building interactive data charts and tables in a traditional SSR (Server-Side Rendering) environment requires more manual DOM manipulation and CSS work than the Python/Streamlit ecosystem.

## Consequences

### Positive
* **Rapid Prototyping:** We can move from a database schema to a live, interactive dashboard in hours rather than days.
* **High AI Efficiency:** LLMs are exceptionally good at writing Python scripts and SQLAlchemy models, which will act as a force multiplier for a junior dev.
* **Lower Cognitive Load:** By staying entirely within the Python ecosystem, we avoid "context switching" between JavaScript (frontend) and Python/Java (backend).

### Negative
* **UI Constraints:** Streamlit is opinionated. If the plant manager demands a highly bespoke, pixel-perfect layout that defies Streamlit’s grid system, we will hit a "wall."
* **Scalability Ceiling:** If this tool eventually needs to support thousands of concurrent external users, we will likely need to rewrite the frontend in React or Vue.
* **State Management:** Handling complex user states in Streamlit can be trickier than in a traditional MVC framework like Spring Boot.