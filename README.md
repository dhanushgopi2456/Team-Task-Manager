# TaskFlow — Team Task Manager

A full-stack web application where users can create projects, assign tasks, and track progress with **role-based access control** (Admin/Member).

![TaskFlow](https://img.shields.io/badge/TaskFlow-Team%20Task%20Manager-6366f1?style=for-the-badge)

## 🚀 Features

### Authentication
- User registration with role selection (Admin/Member)
- Secure login with JWT authentication
- Token refresh for persistent sessions

### Project Management
- Create, edit, and delete projects (Admin)
- Add/remove team members to projects
- Track project progress with task completion percentages
- Project status management (Active/Completed/Archived)

### Task Management
- Full CRUD operations for tasks
- Task assignment to team members
- Status tracking: To Do → In Progress → Review → Completed
- Priority levels: Low, Medium, High, Critical
- Due date tracking with overdue detection
- List view and Kanban board view
- Filter tasks by status, priority, and project

### Dashboard
- Overview stats: Total tasks, In Progress, Completed, Overdue
- Task distribution donut chart
- Recent activity feed
- Overdue tasks alert panel
- Project and team member counts

### Role-Based Access Control
| Feature | Admin | Member |
|---------|-------|--------|
| Create/edit/delete projects | ✅ | ❌ |
| Add/remove team members | ✅ | ❌ |
| Create/edit/delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (assigned tasks) |
| View dashboard | ✅ | ✅ |
| View assigned tasks | ✅ | ✅ |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite), React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| Styling | Custom CSS (Dark theme, Glassmorphism) |
| Deployment | Railway |

## 📦 Project Structure

```
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── api/         # API service layer
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Page components
│   │   ├── styles/      # CSS modules
│   │   └── utils/       # Helpers & constants
│   └── ...
├── server/          # Express backend
│   ├── config/      # Database config
│   ├── controllers/ # Route handlers
│   ├── middleware/   # Auth, RBAC, validation
│   ├── models/      # Mongoose schemas
│   ├── routes/      # API routes
│   └── server.js    # Entry point
└── README.md
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (free tier)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Team_Task_Manager
```

### 2. Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Frontend Setup
```bash
cd client
npm install
```

### 4. Environment Variables

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 5. Run the Application

**Backend** (Terminal 1):
```bash
cd server
npm start
```

**Frontend** (Terminal 2):
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (Admin) |
| GET | `/api/projects/:id` | Project details |
| PUT | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |
| POST | `/api/projects/:id/members` | Add member (Admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (Admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters) |
| POST | `/api/tasks` | Create task (Admin) |
| GET | `/api/tasks/:id` | Task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |
| PATCH | `/api/tasks/:id/status` | Update status |
| GET | `/api/tasks/dashboard/stats` | Dashboard stats |
| GET | `/api/tasks/dashboard/overdue` | Overdue tasks |

## 🌐 Deployment (Railway)

1. Push code to GitHub
2. Create a Railway project
3. Add two services from the same repo:
   - **API**: Root directory = `/server`, Start = `npm start`
   - **Client**: Root directory = `/client`, Build = `npm run build`, Output = `/dist`
4. Add environment variables in Railway dashboard
5. Set up MongoDB Atlas and whitelist `0.0.0.0/0`

## 📝 Demo Credentials

Register as Admin or Member through the signup page. Select your role during registration.

---

Built with ❤️ using the MERN Stack
