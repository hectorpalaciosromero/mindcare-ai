<!-- HEADER -->
<div align="center">
  <img alt="FastAPI Logo" src="https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png" width="200" />
  <h1 align="center">MindCare AI - Backend & AI Engine</h1>
  <strong>Motor de Procesamiento Clínico y Tareas Asíncronas</strong>
</div>
<br>

<div align="center">
  Una arquitectura backend orientada a microservicios construida sobre <b>FastAPI</b>, optimizada para I/O concurrente, tareas asíncronas pesadas mediante <b>Celery</b>, persistencia en <b>PostgreSQL</b> y motores analíticos impulsados por la API de <b>Google Gemini</b>.
</div>
<br>

<div align="center">

  [![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
  [![Pydantic](https://img.shields.io/badge/Pydantic-v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
  [![Celery](https://img.shields.io/badge/Celery-5.3-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)

</div>

---

## 📑 Tabla de Contenidos

1. [🚀 Arquitectura y Filosofía](#-arquitectura-y-filosofía)
2. [📂 Topología Interna (DDD)](#-topología-interna-ddd)
3. [💾 Modelo de Datos y ORM](#-modelo-de-datos-y-orm)
4. [🧠 Motor de Inteligencia Artificial](#-motor-de-inteligencia-artificial)
5. [⚙️ Configuración y Desarrollo Local](#️-configuración-y-desarrollo-local)
6. [🧪 Pruebas Unitarias (Pytest)](#-pruebas-unitarias-pytest)
7. [🔒 Seguridad y Cumplimiento](#-seguridad-y-cumplimiento)
8. [Fundador](#fundador)

---

## 🚀 Arquitectura y Filosofía

Este servicio no es solo una API RESTful estándar; es un orquestador robusto diseñado bajo principios **Clean Architecture**, **Inyección de Dependencias** y **Separación de Tareas**.

### Core Tecnológico (Estándar 2026)
- **Capa de Presentación HTTP:** `FastAPI` + `Gunicorn` (Process Manager) + `Uvicorn` (ASGI), garantizando velocidades a la par con NodeJS y Go.
- **Capa de Validación:** `Pydantic V2` escrito en Rust, permitiendo validación y serialización de datos sub-milisegundo.
- **Capa de Persistencia:** `SQLAlchemy 2.0` (estilo 2.0 puro) sobre `PostgreSQL 16`, evitando el patrón anti-patrón de *lazy loading* implícito y forzando consultas explícitas.
- **Capa Asíncrona (Background):** `Celery` + `Redis` como Message Broker. Maneja la carga pesada de IA generativa (Google Gemini) sin bloquear el Event Loop de la API, previniendo latencia para el usuario final.

---

## 📂 Topología Interna (DDD)

El código sigue una estricta separación de responsabilidades, adaptando patrones de *Domain-Driven Design* para Python:

```text
backend/
├── app/
│   ├── main.py             # Entrypoint ASGI (FastAPI Bootstrap, CORS, Routers)
│   ├── config.py           # Single Source of Truth para Variables de Entorno
│   ├── database.py         # Conexión a BD y Generadores de Sesión
│   ├── models/             # Entidades de Base de Datos (SQLAlchemy)
│   ├── schemas/            # Contratos de Datos (Pydantic DTOs)
│   ├── routers/            # Controladores REST (Solo inyectan dependencias)
│   ├── services/           # Lógica de Negocio Pura (Evita lógica en Routers)
│   ├── ai/                 # Prompts, parsers y lógica del SDK de Gemini
│   ├── middleware/         # Interceptores Edge (Logging, Rate Limiting)
│   └── tasks/              # Definición de colas y workers de Celery
├── alembic/                # Historial inmutable de migraciones SQL (DDL)
├── tests/                  # Suite de pruebas unitarias y E2E
├── Dockerfile              # Imagen optimizada Multi-stage (Alpine/Slim)
└── requirements.txt        # Dependencias fijadas (Pinning absoluto)
```

---

## 💾 Modelo de Datos y ORM

El esquema relacional cuenta con más de 10 tablas optimizadas con índices B-Tree para consultas rápidas de telemetría médica.

- **Diseño Resiliente:** Uso de `UUID`s nativos como llaves primarias en lugar de Auto-Incrementos, previniendo ataques de enumeración (Insecure Direct Object Reference - IDOR).
- **Migraciones Controladas:** Cada cambio al esquema de datos está rigurosamente versionado a través de `Alembic`. **Ningún cambio en producción se realiza sin un archivo de migración.**

*(Nota: Para ver el esquema visual completo, puede conectar un cliente como DBeaver al puerto 5432 del contenedor local).*

---

## 🧠 Motor de Inteligencia Artificial

El módulo de IA (`/app/ai`) actúa como un sistema analítico clínico en la sombra.

### Flujo de Celery (Event-Driven AI)
1. El paciente envía un "Check-in Emocional" a través de la API (`POST /api/patients/checkins`).
2. FastAPI guarda el registro bruto en milisegundos y retorna un `202 Accepted` al frontend.
3. Simultáneamente, envía un evento al broker de **Redis**.
4. El **Celery Worker** toma la tarea de la cola, inyecta los datos del paciente en un *System Prompt* diseñado mediante Ingeniería de Prompts avanzada.
5. Llama a la API de **Google Gemini** con control de `Retries` y `Rate-Limits`.
6. Gemini retorna un análisis estructurado (JSON mode), y el worker guarda la analítica procesada (Sentiment Score, Etiquetas de Alerta, Sugerencias Clínicas) en la base de datos.

---

## ⚙️ Configuración y Desarrollo Local

### Opción A: Contenerizado (Recomendado)
Todo el backend está orquestado desde la raíz del proyecto. Simplemente ejecuta:
```bash
docker-compose up -d backend celery postgres redis
```

### Opción B: Entorno Virtual Puro (Modo Debugger)
1. **Entorno Virtual:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # (En Windows: venv\Scripts\activate)
   ```
2. **Instalación:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Variables de Entorno (`.env`):**
   *(Ver `.env.example` para la lista completa. Necesitarás `GEMINI_API_KEY`).*
4. **Levantar Servidores:**
   ```bash
   # Terminal 1: API Síncrona
   uvicorn app.main:app --reload --port 8000
   
   # Terminal 2: Worker de Celery
   celery -A app.tasks worker --loglevel=info
   ```

---

## 🧪 Pruebas Unitarias (Pytest)

Aseguramos la integridad del código mediante `pytest`, cubriendo los *happy paths* y casos límite (Edge Cases) de la lógica de negocio y seguridad.

```bash
pytest -v -s --disable-warnings
```

*(La configuración de Pytest se ejecuta exclusivamente sobre un contenedor efímero de PostgreSQL 16, garantizando una paridad estricta y absoluta entre Dev/Test/Prod).*

---

## 🔒 Seguridad y Cumplimiento (OWASP Top 10)

1. **No Inyecciones SQL:** Imposibilitado matemáticamente por el uso exclusivo de sentencias preparadas (Prepared Statements) bajo SQLAlchemy 2.0.
2. **Validación de Payloads:** Pydantic V2 rechaza inmediatamente cualquier request maliciosa antes de que toque la lógica de negocio (Fail-Fast).
3. **Seguridad de Contraseñas:** Algoritmo `Bcrypt` iterativo con factor de trabajo alto.
4. **CORS Restringido:** El `CORSMiddleware` rechaza cualquier llamada desde dominios no autorizados, previniendo secuestro de sesiones.

---

## Fundador

**Fundado y desarrollado por Hector Palacios Romero**  
*(Full-Stack & Architecture Engineer)*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/hectorpalaciosromero/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/hectorpalaciosromero)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hectorpalaciosromero1@gmail.com)

---

<div align="center">
  <i>Ingeniería Python construida para soportar escala clínica, concurrencia masiva e Inteligencia Artificial. MindCare AI. 2025-2026.</i>
</div>
