<!-- LOGO & HEADER -->
<div align="center">
  <img alt="MindCare AI Logo" src="./public/logo.png" width="140" />
</div>
<br>

<div align="center">
  <h1 align="center">MindCare AI - Frontend Architecture</h1>
  <strong>Plataforma de Salud Mental Impulsada por Inteligencia Artificial</strong>
</div>
<br>

<div align="center">
  Una arquitectura frontend empresarial moderna, robusta y escalable construida con Next.js 16, React 19 y Tailwind CSS v4 para ofrecer experiencias de usuario de primer nivel en la atención de la salud mental.
</div>
<br>

<div align="center">

  [![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5+-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Zustand](https://img.shields.io/badge/Zustand-5.0-3E2723?style=for-the-badge&logo=react)](https://zustand-demo.pmnd.rs/)
  [![Google GenAI](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

</div>

---

## 📑 Tabla de Contenidos

1. [🌟 Visión General del Producto](#-visión-general-del-producto)
2. [🏗 Arquitectura y Patrones (Standard 2026)](#-arquitectura-y-patrones-standard-2026)
3. [🛠 Stack Tecnológico Detallado](#-stack-tecnológico-detallado)
4. [📂 Topología del Directorio](#-topología-del-directorio)
5. [⚙️ Configuración del Entorno Local](#️-configuración-del-entorno-local)
6. [🔐 Diccionario de Variables de Entorno](#-diccionario-de-variables-de-entorno)
7. [🛡 Seguridad y Rendimiento](#-seguridad-y-rendimiento)
8. [🚀 Despliegue CI/CD](#-despliegue-cicd)
9. [🤝 Guía de Contribución](#-guía-de-contribución)
10. [Fundador](#fundador)

---

## 🌟 Visión General del Producto

**MindCare AI** redefine la interacción entre pacientes y profesionales de la salud mental mediante el uso de inteligencia artificial generativa. Este repositorio contiene el **Frontend Service**, diseñado para operar como una Single-Page Application hiper-optimizada y Server-Rendered.

### Capacidades Principales (Core Features)
- **Portales Multi-Rol Basados en RBAC:** Paneles de control aislados de forma segura para `Administradores`, `Pacientes` y `Psicólogos`.
- **Integración Nativa con IA:** Chat interactivo impulsado por Google Gemini SDK (`@google/genai`) para asistencia al paciente y análisis clínico de apoyo para profesionales.
- **Manejo Dinámico de Formularios Complejos:** Flujos de onboarding y registros clínicos validados en tiempo real sin cuellos de botella de renderizado.
- **Gestión de Telemedicina Síncrona:** Interfaz de videoconsultas (Meet/Zoom) renderizada condicionalmente con flujos de cancelación Optimistic UI.
- **Exportación de Datos Médicos:** Generación de reportes clínicos en PDF lado cliente (sin coste de servidor) mediante `jsPDF`.

---

## 🏗 Arquitectura y Patrones (Standard 2026)

Este proyecto rechaza las configuraciones monolíticas tradicionales a favor de una arquitectura orientada a la **Separación Estricta de Responsabilidades (SoC)** y **Colocation**.

- **React Server Components (RSC) First:** Minimizamos el JavaScript enviado al navegador. La directiva `"use client"` está estrictamente restringida a los nodos de hoja interactivos (botones, formularios, modales).
- **Edge Middleware Security:** `middleware.ts` se ejecuta globalmente en el Edge para la validación de tokens JWT y redireccionamiento pre-renderizado, evitando flickeos de autenticación (Auth Flashes).
- **BFF (Backend For Frontend):** Uso intensivo del directorio `/api` de Next.js como capa proxy para ofuscar claves API (como la de Gemini) y adaptar las respuestas de nuestro backend FastAPI a interfaces TypeScript estrictas consumibles por la UI.
- **Graceful Degradation (Resiliencia):** Uso extensivo de fronteras de error (`error.tsx`) y estados de carga modulares (`loading.tsx`) con Skeletons para garantizar Core Web Vitals en el percentil 99.

---

## 🛠 Stack Tecnológico Detallado

| Categoría | Tecnología / Librería | Razón Arquitectónica |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.2 (App Router)** | Renderizado híbrido (SSR/SSG), optimización automática de imágenes/fuentes y Edge functions. |
| **UI Library** | **React 19.2** | Uso de hooks concurrentes avanzados, Actions y server-side rendering nativo mejorado. |
| **Estilizado** | **Tailwind CSS v4** | Motor PostCSS de alta velocidad. Utility-first para diseño consistente. |
| **Estado (Global)** | **Zustand 5.0** | Estado inmutable, libre de boilerplate, con un impacto de bundle insignificante (< 2kb). |
| **Estado (Local) & Formularios**| **React Hook Form + Zod** | Validación isomórfica inferida por tipos. Renderizados aislados que no bloquean el UI Thread. |
| **Animaciones** | **Framer Motion 12.38** | Micro-interacciones hardware-accelerated fluidas a 60 FPS (o 120 FPS). |
| **Visualización** | **Recharts 3.8** | Gráficos D3.js declarativos para los dashboards analíticos de los psicólogos. |

---

## 📂 Topología del Directorio

El sistema de archivos está organizado por dominios de negocio (Features) dentro de `app/` y responsabilidades técnicas dentro de `src/`.

```text
frontend/
├── src/
│   ├── app/                    # Capa de Enrutamiento (Next.js App Router)
│   │   ├── (landing)/          # Páginas de marketing (SSG para SEO máximo)
│   │   ├── admin/              # Dashboard de administración global
│   │   ├── login/              # Flujo Auth: Login
│   │   ├── register/           # Flujo Auth: Registro multi-step
│   │   ├── patient/            # Portal de Paciente (Métricas, citas, chat IA)
│   │   ├── psychologist/       # Portal de Psicólogo (Análisis de historias clínicas)
│   │   ├── api/                # Proxy BFF (Protección CORS y ocultación de tokens)
│   │   ├── globals.css         # Configuración del motor Tailwind v4
│   │   └── layout.tsx          # App Root (Providers, Font Optimization, Meta SEO)
│   ├── components/             # Sistema de Diseño Presentacional
│   │   ├── auth/               # Inputs securizados, validaciones visuales
│   │   ├── chat/               # Interfaz de WebSockets/Streaming para IA
│   │   ├── dashboard/          # Data-tables, widgets y Recharts
│   │   └── ui/                 # Core Design System (Botones, Modales, Cards)
│   ├── hooks/                  # Lógica de React extraída y testeable (Custom Hooks)
│   ├── lib/                    # Lógica agnóstica (HTTP fetchers, helpers de Zod)
│   ├── types/                  # Contratos de TypeScript (`.d.ts`, Interfaces globales)
│   └── middleware.ts           # Interceptor Edge de Rutas y Sesiones
├── public/                     # Assets estáticos inmutables
├── package.json                # Registry de dependencias
└── next.config.js              # Configuración del Compilador Rust/SWC de Next
```

---

## ⚙️ Configuración del Entorno Local

Diseñado para un "Developer Experience" (DX) instantáneo.

**1. Dependencias del Sistema:**
- Node.js >= 20.0.0
- Backend Python FastAPI operativo.

**2. Instalación:**
```bash
git clone https://github.com/HectorPalacios/mindcare-ai.git
cd frontend
npm install  # (o pnpm install para mayor velocidad)
```

**3. Entorno:**
Duplicar el `.env.example` (o crear `.env.local`):
```bash
cp .env.example .env.local
```

**4. Ejecución en Desarrollo:**
```bash
npm run dev
```
La aplicación se lanzará en **`http://localhost:3000`** con soporte para Turbopack y Hot Module Replacement (HMR).

---

## 🔐 Diccionario de Variables de Entorno

| Variable | Descripción | Entorno Obligatorio |
| :--- | :--- | :---: |
| `NEXT_PUBLIC_API_URL` | URL base del backend principal (FastAPI). Expuesta al cliente de forma segura. | Todos |
| `NEXT_PUBLIC_APP_URL` | URL canónica de este frontend (usada para meta tags SEO y sitemaps). | Todos |
| `GEMINI_API_KEY` | Llave secreta del SDK `@google/genai`. **(NOTA: NUNCA usar `NEXT_PUBLIC_` aquí)**. | Servidor |
| `JWT_SECRET` | Llave de desencriptado temporal para el Middleware perimetral (Edge). | Servidor |

---

## 🛡 Seguridad, Rendimiento y Calidad de Código

Nuestra infraestructura frontend cumple con los lineamientos globales OWASP 2026 y opera bajo una estricta política de **"Zero-Tolerance"** en la compilación:

- **Strict Type-Safety (Zero `any`):** Tipado estricto absoluto en todo el monorepo mediante el uso de genéricos, constructos `unknown` y type guards. Garantiza contratos predecibles en la ingesta de JSON dinámicos desde la IA.
- **Zero-Warning State:** El compilador (`next build`) y linter (`eslint`) operan sin una sola advertencia (Exit code: 0). Los efectos secundarios asíncronos en `useEffect` están matemáticamente controlados.
- **Manejo Seguro de Excepciones (Graceful Degradation):** Tipado estricto en los bloques de captura (`error: unknown`) con validación defensiva del DOM para evitar caídas (crashes) en producción. Uso extensivo de fronteras de error modulares.
- **Prevención XSS y CSRF:** Sanitización intrínseca por defecto a través de React 19 y manejo estricto de headers a través del BFF.
- **Lighthouse Targeting:** Diseñado estructuralmente para alcanzar **Puntuaciones 95+** en Rendimiento, Accesibilidad (a11y), Mejores Prácticas y SEO.
- **Carga Diferida (Lazy Loading):** Los componentes pesados como `Recharts` o `jsPDF` se importan dinámicamente mediante `next/dynamic` para evitar bloqueos del Main Thread.

---

## 🚀 Despliegue CI/CD

El proyecto utiliza un pipeline continuo automatizado.

### Para Entornos Cloud (Vercel / AWS Amplify)
Cero configuración requerida. Simplemente conecte el repositorio; los comandos de compilación están estandarizados:
```bash
npm run build
```

### Para Infraestructura Docker / Kubernetes
Next.js está configurado en el `next.config.js` (`output: 'standalone'`). Esto rastrea y agrupa exclusivamente los archivos necesarios para la ejecución final.

**Construcción de Imagen Optimizada (Distroless/Alpine):**
```bash
docker build -t mindcare-frontend:latest .
docker run -p 3000:3000 mindcare-frontend:latest
```

---

## 🤝 Guía de Contribución

Nos adherimos a la cultura de ingeniería rigurosa.

1. **Ramas (Branches):** Seguir convención `feat/nombre-feature`, `fix/nombre-bug`, `chore/mantenimiento`.
2. **Commits:** Aplicar [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `refactor:`, `docs:`).
3. **Calidad de Código:** Ningún Pull Request es aceptado si `npm run lint` y los checks de TypeScript no pasan en verde (Strict Mode habilitado).

---

## Fundador

**Fundado y desarrollado por Hector Palacios Romero**  
*(Full-Stack & Architecture Engineer)*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/hectorpalaciosromero/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/hectorpalaciosromero)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hectorpalaciosromero1@gmail.com)

---

<div align="center">
  <i>Ingeniería Front-End construida con absoluta precisión. MindCare AI. 2025-2026.</i>
</div>
