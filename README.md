# Task 3: Interactive Dynamic Task Dashboard Platform

**Progree Full Stack Development Internship**  
**Author:** Mohsin Ali Shah  
**GitHub:** [@mohsinshah12309](https://github.com/mohsinshah12309)

---

## 📌 Objective
Build a functional full-stack data application allowing user CRUD actions, connecting an asynchronous frontend interface to a secure backend microservice API using `async/await` fetch calls, and persisting data against an active local SQLite database.

---

## 🚀 Architecture & Tech Stack

- **Frontend:** Responsive vanilla JavaScript dashboard interface utilizing ES6+ `async/await` fetch calls, responsive CSS Grid/Flexbox layouts, real-time statistics counters, debounced search filtering, and animated toast feedback.
- **Backend Microservice:** Node.js & Express.js REST API providing complete CRUD operations, parameterized SQL queries, CORS headers, and input validation.
- **Local Database:** Embedded SQLite instance (`node:sqlite`) with automatic schema initialization and pre-seeded tasks stored persistently in `tasks.db`.

---

## 📡 REST API Specifications

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Retrieve tasks with optional filters (`?status=`, `?search=`) | None |
| `GET` | `/api/stats` | Retrieve metrics (total, pending, completed, high priority) | None |
| `POST` | `/api/tasks` | Create new task | `{ title, description, priority, category }` |
| `PUT` | `/api/tasks/:id` | Update existing task details | `{ title, description, priority, category }` |
| `PATCH` | `/api/tasks/:id/toggle` | Toggle task completion status | None |
| `DELETE` | `/api/tasks/:id` | Delete task by ID | None |

---

## 📂 Project Structure
```text
progree-task3-task-dashboard/
├── public/
│   ├── index.html     # Dashboard layout & modals
│   ├── style.css      # CSS Grid metrics & responsive styling
│   └── app.js         # Asynchronous CRUD client with fetch async/await
├── server.js          # Express microservice & SQLite database logic
├── package.json       # Project dependencies & scripts
├── tasks.db           # Local persistent SQLite database
└── README.md          # Comprehensive documentation
```

---

## 💻 How to Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   npm start
   ```

3. **Open in browser:**  
   Navigate to [http://localhost:5000](http://localhost:5000)
