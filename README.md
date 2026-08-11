# 🧬 Abdora AI - Intelligent Biology Learning Platform

[![GitHub Stars](https://img.shields.io/github/stars/AbdulhodiyOmonboyev/Abdora-ai.svg?style=social)](https://github.com/AbdulhodiyOmonboyev/Abdora-ai)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://react.dev)

**Abdora AI** - Uzbekistan uchun yaratilgan artificial intelligence powered biology o'qitish platformasi. O'qituvchi, o'quvchi va administrator uchun to'liq xususiyatlarga ega modern ta'lim tizimi.

## 🎯 Asosiy Xususiyatlari

### 📚 O'quvchi Uchun
- ✅ AI-powered dars materiallari va video tushuntirishlar
- ✅ Interaktiv o'qituvchi (Speaking Practice)
- ✅ Test va imtihon tizimi
- ✅ Uy vazifalari va submission
- ✅ Attendance tracking
- ✅ Progress analytics va XP sistema

### 👨‍🏫 O'qituvchi Uchun
- ✅ Dars yaratish va boshqarish
- ✅ Test tayyorlash va grading
- ✅ O'quvchi attendance
- ✅ Guruh boshqarish
- ✅ Analytics va performance reports
- ✅ AI-assisted content generation

### 🏢 Administrator Uchun
- ✅ Markaziy filiallarni boshqarish
- ✅ O'qituvchi va manager management
- ✅ Reception staff boshqarish
- ✅ System-wide analytics
- ✅ Settings va configuration

### 📱 Reception Uchun
- ✅ Guruh yaratish va tahrirlash
- ✅ O'quvchi qabul qilish
- ✅ To'lov tracking
- ✅ Muammo hal qilish

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Query** - Data fetching & caching
- **Framer Motion** - Animations
- **Lucide Icons** - Icon library
- **React Hot Toast** - Notifications
- **Chart.js / Recharts** - Data visualization

### Backend
- **Node.js + Express** - Server
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **Anthropic API** - AI features

### DevOps
- **Render** - Deployment
- **Docker** - Containerization
- **GitHub** - Version control

---

## 📁 Project Structure

```
Abdora-ai/
├── bialogiya_frontend/          # React frontend
│   ├── src/
│   │   ├── pages/               # Page components
│   │   │   ├── admin/          # Admin panel
│   │   │   ├── teacher/        # Teacher dashboard
│   │   │   ├── student/        # Student portal
│   │   │   └── reception/      # Reception desk
│   │   ├── components/          # Reusable components
│   │   ├── store/              # Zustand state
│   │   ├── utils/              # Utility functions
│   │   └── config/             # Configuration
│   ├── package.json
│   └── vite.config.js
│
├── bialogiya_beakent/           # Node.js backend
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Custom middleware
│   │   ├── models/             # Data models
│   │   └── utils/              # Helper functions
│   ├── prisma/                 # Database schema
│   ├── server.js               # Server entry
│   └── package.json
│
└── render.yaml                 # Deployment config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0+
- npm yoki yarn
- PostgreSQL database
- Git

### Installation

1. **Repository clone qilish**
```bash
git clone https://github.com/AbdulhodiyOmonboyev/Abdora-ai.git
cd Abdora-ai
```

2. **Backend setup**
```bash
cd bialogiya_beakent
npm install

# .env file yaratish
cp .env.example .env
# DATABASE_URL, JWT_SECRET va boshqa o'zgaruvchilarni to'ldiring

# Database migration
npx prisma migrate dev

# Server run qilish
npm start
```

3. **Frontend setup**
```bash
cd ../bialogiya_frontend
npm install

# .env file yaratish
cp .env.example .env
VITE_API_URL=http://localhost:3000

# Development server
npm run dev
```

4. **Browser oching**
```
http://localhost:5173
```

---

## 📖 API Documentation

### Authentication
```
POST /auth/login
POST /auth/register
POST /auth/refresh
GET /auth/me
```

### Users
```
GET /users                  # Barcha foydalanuvchiler
GET /users/:id             # Foydalanuvchi details
POST /users/create-manager # Manager yaratish
POST /users/create-student # O'quvchi yaratish
PUT /users/:id             # Foydalanuvchi update
DELETE /users/:id          # Foydalanuvchi delete
```

### Groups
```
GET /groups                 # Barcha guruhlar
POST /groups               # Guruh yaratish
GET /groups/:id            # Guruh details
PUT /groups/:id            # Guruh update
```

### More endpoints...
Complete API documentation: [API Docs](https://github.com/AbdulhodiyOmonboyev/Abdora-ai/wiki/API-Reference)

---

## 🔐 Authentication

JWT token based authentication ishlatiladi:

```javascript
// Login
const response = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'password'
  })
});

const { token } = await response.json();

// API calls
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## 🎨 UI/UX Features

- **Dark Mode Support** - Light/Dark theme switching
- **Responsive Design** - Mobile, tablet, desktop optimized
- **Animations** - Smooth transitions va interactions
- **Icons** - Lucide icons throughout
- **Notifications** - Real-time toast notifications
- **Loading States** - Skeletal loaders va spinners

---

## 📊 Database Schema

Main entities:
- `User` - All users (admin, teacher, student, reception, manager)
- `Group` - Class/batch
- `Branch` - School/center branch
- `Lesson` - Course material
- `Test` - Quizzes and exams
- `Homework` - Assignments
- `Attendance` - Daily attendance records
- `Payment` - Payment tracking

[Full schema](bialogiya_beakent/prisma/schema.prisma)

---

## 🌐 Deployment

### Render Platform
```yaml
# render.yaml
services:
  - name: abdora-backend
    type: web
    env: node
    buildCommand: npm install
    startCommand: npm start
    
  - name: abdora-frontend
    type: static
    buildCommand: npm install && npm run build
    staticPublishPath: dist
```

Deploy commands:
```bash
# Push to GitHub
git push origin main

# Render auto-deploys from GitHub
```

Live: [https://abdora-ai-frontend.onrender.com](https://abdora-ai-frontend.onrender.com)

---

## 🐛 Bug Reports & Features

Issues va feature requests uchun:
[GitHub Issues](https://github.com/AbdulhodiyOmonboyev/Abdora-ai/issues)

---

## 🤝 Contributing

Contributions welcome! Iltimos:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

MIT License - [LICENSE](LICENSE) file qarang

---

## 👤 Author

**Abdulhodi Omonboyev**
- GitHub: [@AbdulhodiyOmonboyev](https://github.com/AbdulhodiyOmonboyev)
- Email: abdulhodi@example.com

---

## 🙏 Acknowledgments

- Anthropic API - AI features
- Prisma - Database management
- React team - Frontend framework
- TailwindCSS - Styling
- Uzbekistan tech community

---

## 📞 Support

Savollar va muammo uchun:
- 📧 Email: support@abdora.uz
- 💬 GitHub Issues: [Issues](https://github.com/AbdulhodiyOmonboyev/Abdora-ai/issues)
- 🌐 Website: [abdora.uz](https://abdora.uz)

---

**Made with ❤️ for education in Uzbekistan**
