# Contributing to Abdora AI

Birinchi navbatda, Abdora AI loyihasiga contribution qilishni o'ylagan ekaniz, rahmat! 🙏

Ushbu dokumentda loyihaga qanday hissa qo'shishingiz mumkinligi haqida o'qishingiz mumkin.

## 📋 Index

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Style Guide](#style-guide)
- [Testing](#testing)

---

## 📖 Code of Conduct

Bu loyiha Open Code of Conduct ga amal qiladi. Barcha contributors bu conduct ni qabul qilashlari kerak. Ohangni, hurmat va inklyusiv muhit saqlab qolish juda muhim.

---

## 🚀 Getting Started

### 1. Repository Fork Qilish

GitHub-da Abdora-ai repository-ni fork qiling:
```
https://github.com/AbdulhodiyOmonboyev/Abdora-ai/fork
```

### 2. Local Cloning

```bash
git clone https://github.com/YOUR-USERNAME/Abdora-ai.git
cd Abdora-ai
git remote add upstream https://github.com/AbdulhodiyOmonboyev/Abdora-ai.git
```

### 3. Branch Yaratish

```bash
git checkout -b feature/your-feature-name
# yoki
git checkout -b fix/bug-name
```

---

## 💻 Development Setup

### Requirements
- Node.js 18.0+
- npm/yarn
- PostgreSQL
- Git

### Backend Setup

```bash
cd bialogiya_beakent

# Dependencies install
npm install

# .env file yaratish
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/abdora_dev
JWT_SECRET=your-secret-key
NODE_ENV=development
ANTHROPIC_API_KEY=your-api-key
EOF

# Database migration
npx prisma migrate dev

# Server run
npm run dev
```

### Frontend Setup

```bash
cd bialogiya_frontend

# Dependencies install
npm install

# .env file yaratish
cat > .env << EOF
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Abdora AI
EOF

# Development server
npm run dev
```

---

## ✏️ Making Changes

### Code Style

#### JavaScript/React
- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Always use
- **Naming**: camelCase for variables, PascalCase for components

```javascript
// ✅ Good
const userProfile = {
  firstName: 'John',
  email: 'john@example.com'
};

const UserCard = ({ user }) => {
  return <div className='card'>{user.firstName}</div>;
};

// ❌ Bad
const userProfile = {
  FirstName: 'John',
  Email: 'john@example.com'
};

const userCard = ({ user }) => {
  return <div className="card">{user.firstName}</div>;
};
```

#### React Components

```javascript
// Functional component template
import { useState } from 'react';
import api from '../../config/axios';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function ComponentName() {
  const [state, setState] = useState(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['unique-key'],
    queryFn: () => api.get('/endpoint').then(r => r.data?.data || [])
  });
  
  const mutation = useMutation({
    mutationFn: (data) => api.post('/endpoint', data),
    onSuccess: () => console.log('Success')
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className='container'>
      <h1>Component Title</h1>
      {/* Content */}
    </div>
  );
}
```

### Commits

#### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semicolons, etc)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build, dependencies, etc

**Scope:**
- `frontend`
- `backend`
- `database`
- `auth`
- `ui`
- etc.

**Examples:**
```bash
git commit -m "feat(auth): add oauth2 login support"
git commit -m "fix(frontend): resolve filter array error on managers page"
git commit -m "docs(readme): update installation instructions"
```

### Branches

Branch naming convention:

```
feature/<feature-name>      # New features
fix/<bug-name>              # Bug fixes
docs/<doc-name>             # Documentation
refactor/<component-name>   # Refactoring
```

Examples:
```bash
git checkout -b feature/dark-mode
git checkout -b fix/login-error
git checkout -b docs/api-guide
```

---

## 🧪 Testing

### Frontend Tests

```bash
cd bialogiya_frontend

# Run tests
npm test

# Coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Backend Tests

```bash
cd bialogiya_beakent

# Run tests
npm test

# Coverage
npm test -- --coverage

# Integration tests
npm test -- --integration
```

---

## 📤 Submitting Changes

### 1. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 2. Create Pull Request

GitHub-da pull request yarating:

- **Title**: Qisqa va tushunarli sarlavha
- **Description**: Nima qilganingiz, nega qilganingiz
- **Related Issues**: `Closes #123` format da
- **Checklist**: Quyidagi itemlarni tekshiring

```markdown
## Description
Nima qo'shib/o'zgartib yubordim

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Frontend tests pass
- [ ] Backend tests pass
- [ ] Manual testing done

## Checklist
- [ ] My code follows the style guide
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated documentation
- [ ] My changes generate no errors
```

### 3. Code Review

Maintainers ko'ribadi va feedback beradi. Qayta tekshiruv uchun takmaa qilishingiz mumkin.

---

## 🎯 Contribution Areas

### Backend
- API improvements
- Database optimization
- Authentication/Authorization
- Error handling
- Performance optimization
- Unit tests

### Frontend
- UI/UX improvements
- Components
- Pages
- State management
- Error handling
- Responsive design
- Dark mode support

### Documentation
- README improvements
- API documentation
- Installation guides
- Contributing guides
- Code examples
- Tutorials

### Localization
- Uzbek translations
- Russian translations
- Other language support

---

## 🐛 Bug Reports

Bug report berish:

1. **Title**: Clear va descriptive
2. **Description**: Nima bo'lganini tasvirlab bering
3. **Steps**: Reproduce qilish uchun steps
4. **Expected**: Nima bo'lishi kerak edi
5. **Actual**: Nima bo'ldi
6. **Environment**: OS, browser, Node version, etc

Template:
```markdown
## Description
[Muammo haqida qisqa tavsif]

## Steps to Reproduce
1. Shunday qilish...
2. Keyin shunday...
3. Natija...

## Expected Behavior
[Nima bo'lishi kerak edi]

## Actual Behavior
[Nima bo'ldi]

## Environment
- OS: [macOS / Windows / Linux]
- Browser: [Chrome / Safari / Firefox]
- Node: 18.0.0
```

---

## 💡 Feature Requests

Feature request uchun:

1. **Title**: Yangi feature nomi
2. **Description**: Nima kerak, nega kerak
3. **Use Case**: Qanday ishlatiladi
4. **Example**: Misol yoki mockup

---

## 📞 Questions?

Savol bo'lsa:
- **GitHub Issues**: [Issues](https://github.com/AbdulhodiyOmonboyev/Abdora-ai/issues)
- **Email**: contact@abdora.uz
- **Discussions**: [GitHub Discussions](https://github.com/AbdulhodiyOmonboyev/Abdora-ai/discussions)

---

## 🎉 Contributors

Barcha contributors shahringizni uchun rahmat! Contributors list:
[CONTRIBUTORS.md](CONTRIBUTORS.md)

---

**Happy contributing! 🚀**
