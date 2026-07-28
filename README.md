# SportSphere Hub

SportSphere Hub is a full-stack web application for managing sports facilities, reservations, trainers, products, ads, and user accounts. The project is organized as an Angular frontend with a Node.js/Express TypeScript backend connected to MongoDB.

## Features

- public browsing of sports facilities and facility details
- registration, login, forgot password, and password reset flows
- role-based access for administrators, employees, and athletes
- administration of users, sports, trainers, registration requests, and facility requests
- facility management for employees
- resource, promotion, product, and order management
- reservations and employee calendar
- attendance tracking
- athlete shop, cart, and order checkout
- trainer browsing and booking
- athlete ads and ad requests
- facility reviews and ratings
- file upload and static file serving through the backend

## Tech Stack

**Frontend**

- Angular 20
- TypeScript
- Angular Router
- RxJS
- FullCalendar
- CSS

**Backend**

- Node.js
- Express 5
- TypeScript
- MongoDB / Mongoose
- JWT authentication
- bcrypt
- Multer
- dotenv

## Project Structure

```text
SportSphere-Hub/
|-- backend/              # Express API, models, routes, services, and middleware
|   `-- src/
|       |-- config/       # database, environment, and upload configuration
|       |-- middleware/   # auth, role, error, and not-found middleware
|       |-- models/       # Mongoose models
|       |-- modules/      # feature modules
|       |-- routes/       # main API route registration
|       `-- utils/        # utility helpers
|-- frontend/             # Angular application
|   `-- src/
|       |-- app/
|       |   |-- components/
|       |   `-- core/
|       `-- environments/
`-- uploads/              # locally stored uploaded files
```

## Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- MongoDB, either local or hosted with a service such as MongoDB Atlas

## Installation

Clone the repository and install dependencies for both apps:

```bash
git clone <repository-url>
cd SportSphere-Hub

cd backend
npm install

cd ../frontend
npm install
```

## Backend Configuration

Create a `.env` file inside the `backend` directory:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/sportsphere_hub
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Required environment variables:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - secret key used for signing JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time

The backend uses port `4000` by default. The frontend expects the API at `http://localhost:4000/api`.

## Running the Project

Start the backend TypeScript compiler in watch mode:

```bash
cd backend
npm run dev
```

In another terminal, start the compiled backend server:

```bash
cd backend
npm start
```

Start the frontend:

```bash
cd frontend
npm start
```

The application will be available at:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

## Build

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

## Type Checking and Tests

Backend type check:

```bash
cd backend
npm run typecheck
```

Frontend tests:

```bash
cd frontend
npm test
```

## API Modules

Main backend routes are registered under `/api`:

- `/api/auth`
- `/api/admin`
- `/api/ads`
- `/api/athletes`
- `/api/employees`
- `/api/facilities`
- `/api/apply-requests`
- `/api/public`
- `/api/sports`
- `/api/trainers`
- `/api/users`
- `/api/products`
- `/api/cart/items`
- `/api/orders`

## User Roles

The application uses three main roles:

- `admin` - manages the system, users, sports, trainers, and requests
- `employee` - manages facilities, resources, trainers, products, promotions, attendance, calendar, and orders
- `athlete` - manages profile, reservations, trainers, shop, cart, orders, ads, and trainings

## GitHub Notes

- `node_modules`, build output, and local `.env` files should not be committed.
- The `uploads/` directory is used for locally uploaded files. Commit only a placeholder file if the directory should exist in the repository.
- Before pushing changes, it is recommended to run `npm run build` in both `backend` and `frontend`.

## Author

SportSphere Hub project.
