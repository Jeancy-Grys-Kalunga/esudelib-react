# EsudeLib - Academic Management & Deliberation Platform

EsudeLib is a comprehensive, modular academic management platform designed for higher education institutions. It streamlines institutional administration, student lifecycle management, and the complex process of academic deliberations (juries).

Built with a modern, high-performance stack, it integrates Machine Learning for advanced analytics and features a seamless user experience powered by React and Inertia.js.

---

## 🚀 Key Features

### 🏛️ Institutional Management
- **Multi-Institution Support**: Manage multiple campuses or schools from a single platform.
- **Department & Program Tracking**: Structure academic programs, courses, and faculty assignments.

### 🎓 Student Lifecycle
- **Registration Desk**: Streamlined enrollment process and student registration tracking.
- **Academic Performance**: Management of grades, notes, and transcripts.
- **Appeals System**: Integrated student appeal management with supporting document uploads.
- **Payment Tracking**: Monitor tuition fees and student financial records.

### ⚖️ Deliberation & Juries
- **Jury Management**: Organize and manage academic juries for student evaluations.
- **Automated Deliberations**: Tools to facilitate and automate the deliberation process.
- **Report Generation**: Automatic generation of official deliberation minutes and academic reports.

### 🧠 Intelligent Analytics
- **Machine Learning Integration**: Powered by Rubix ML for predictive analytics on student success and performance trends.
- **Data Visualization**: Interactive dashboards and charts using Recharts.

---

## 🛠️ Technical Stack

### **Backend**
- **Framework**: [Laravel 12](https://laravel.com/) (PHP 8.2+)
- **Architecture**: Modular approach using `laravel-modules`.
- **Media Management**: [Spatie MediaLibrary](https://spatie.be/docs/laravel-medialibrary) for robust file handling.
- **Permissions**: [Spatie Permission](https://spatie.be/docs/laravel-permission) for granular Role-Based Access Control (RBAC).
- **Communication**: Integrated with **Twilio**, **Vonage**, and **Infobip** for SMS and Email notifications.

### **Frontend**
- **Framework**: [React 19](https://react.dev/)
- **Bridge**: [Inertia.js](https://inertiajs.com/) for single-page application feel within a classic routing model.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & **Radix UI** for premium, accessible UI components.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Form Handling**: React Dropzone for file uploads.
- **Notifications**: React Hot Toast & React Toastify.

### **Reporting & Tools**
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) and [html2canvas](https://html2canvas.hertzen.com/).
- **Excel Export**: [Maatwebsite/Laravel-Excel](https://laravel-excel.com/).
- **Diagrams**: PlantUML Integration for architectural visualizations.

---

## 🐳 Docker Deployment

The project is containerized for easy deployment and development using Docker Compose.

- **Services**:
  - `laravel`: Core application service.
  - `frontend`: Vite-powered dev/build service.
  - `ml`: Dedicated service for Machine Learning tasks.
  - `mariadb`: Relational database.
  - `redis`: High-speed caching and queue management.

### Quick Start
```bash
# Register environment variables
cp .env.example .env

# Build and start services
docker-compose up -d --build

# Install dependencies
docker-compose exec laravel composer install
docker-compose exec frontend npm install

# Run migrations
docker-compose exec laravel php artisan migrate
```

---

## 🧪 Development & Quality

- **Testing**: PHPUnit for backend tests.
- **Code Style**: Prettier and ESLint for frontend consistency.
- **Deployment**: Integrated deployment scripts (`deploy.sh`, `deploy.ps1`) for various environments.

---

Developed with ❤️ for Academic Excellence.
