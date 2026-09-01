# Security Policy

## Supported Versions

Bu jadvalda Abdora AI-ning qaysi versiyalariga security updates berilayotganini ko'rsatadi:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

Agar siz Abdora AI-da security zaifligini topgan bo'lsangiz, iltimos:

1. **Email orqali bildiring:** security@abdora.uz
2. **GitHub Security Advisory** ishlatib: https://github.com/AbdulhodiyOmonboyev/Abdora-ai/security/advisories
3. **GitHub Issues ishlatmang** - bu public, security risk yaratadi

### Talab qilinadigan ma'lumot:

- Zaiflikning tafsilotli tavsifi
- Tarabu-tuproq zaiflik manifesto (proof of concept)
- Qanday amal qilsa zaiflik paydo bo'ladi
- Impact assessment (Qancha jiddiy?)
- Tavsiya etilgan fix (agar bilsangiz)

## Response Timeline

- **24 soat ichida:** Zaiflikni tasdiqlash
- **48 soat ichida:** Initial assessment
- **7 kun ichida:** Fix va test
- **14 kun ichida:** Release security patch

## Security Best Practices

### Frontend Security
- ✅ JWT token-based authentication
- ✅ Secure storage (localStorage/sessionStorage)
- ✅ CORS enabled only for trusted domains
- ✅ CSP (Content Security Policy) headers
- ✅ Input validation va sanitization
- ✅ XSS protection

### Backend Security
- ✅ Environment variables for sensitive data
- ✅ Rate limiting on API endpoints
- ✅ SQL injection prevention (Prisma ORM)
- ✅ CSRF protection
- ✅ Password hashing (bcrypt)
- ✅ JWT signature verification
- ✅ Role-based access control (RBAC)

### Database Security
- ✅ Password hashing with bcrypt
- ✅ Data encryption for sensitive fields
- ✅ Regular backups
- ✅ Principle of least privilege
- ✅ SQL injection prevention

### Deployment Security
- ✅ HTTPS only
- ✅ Environment-based configuration
- ✅ Secrets management
- ✅ Regular security updates
- ✅ Vulnerability scanning
- ✅ Docker image scanning

## Security Headers

Quyidagi security headers taqdim etiladi:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

## Dependency Management

- 📦 npm audit qo'llaniladi
- 🔍 Regular vulnerability scanning
- 🔄 Timely updates
- 📋 Dependabot enabled

## Compliance

Abdora AI quyidagilarga mos:

- 🔒 MIT License
- 🛡️ OWASP Top 10 protection
- 🔐 JWT standard (RFC 7519)
- 📊 GDPR va data protection principles

## Security Testing

- ✅ Input validation testing
- ✅ Authentication testing
- ✅ Authorization testing
- ✅ API security testing
- ✅ Frontend security testing
- ✅ Database security testing

## Contacts

- 📧 Email: security@abdora.uz
- 🐛 Issues: https://github.com/AbdulhodiyOmonboyev/Abdora-ai/issues
- 👤 Maintainer: Abdulhodi Omonboyev

---

**Last Updated:** August 2024
