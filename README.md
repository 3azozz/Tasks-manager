# Task Manager

Full-stack task manager: Node.js + MongoDB + Docker.

## How to run

1. Make sure Docker Desktop is open
2. Open a terminal
3. Go into this folder:
   cd taskapp
4. Run:
   docker-compose up --build
5. Open your browser and go to:
   http://localhost:3000

That's it. One URL for everything.

## How to stop

Press Ctrl+C in the terminal, then run:
  docker-compose down

## API endpoints (for Postman)

GET    http://localhost:3000/tasks
POST   http://localhost:3000/tasks       body: { "title": "...", "priority": "high" }
PUT    http://localhost:3000/tasks/:id   body: { "status": "done" }
DELETE http://localhost:3000/tasks/:id
GET    http://localhost:3000/health

## Deploy on Railway

1. Sign up at https://railway.app
2. New Project → Deploy from GitHub repo
3. Add MongoDB: + New → Database → MongoDB
4. Set variable: MONGO_URL = (copy from the MongoDB service)
5. open using the url
