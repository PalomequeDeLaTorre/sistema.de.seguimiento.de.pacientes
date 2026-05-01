# Sistema de Seguimiento de Pacientes

Sistema simple de seguimiento de pacientes construido con Next.js 15, PostgreSQL (Neon) y Tailwind CSS.

## Características
- Next.js 15 App Router
- Tailwind CSS
- PWA básica (manifest + service worker)
- PostgreSQL (Neon)
- Autenticación con JWT
- Registro de usuario
- Login
- Cambio de contraseña
- Un solo tipo de usuario
- Cada usuario solo ve sus datos
- Registro de pacientes con ficha editable
- Seguimientos independientes por paciente
- Historial con gráficas
- Exportación a PDF individual y ZIP

## Requisitos
- Node.js 18+
- Cuenta en Neon (PostgreSQL gratuito)

## Instalación
1. Clonar o descomprimir el proyecto  
2. Instalar dependencias:

npm install

3. Copiar `.env.example` a `.env.local` y configurar las variables:

NEON_DB_HOST=tu-host.neon.tech
NEON_DB_PORT=5432
NEON_DB_NAME=tu-database
NEON_DB_USER=tu-usuario
NEON_DB_PASSWORD=tu-password
NEON_DATABASE_URL=postgresql://...
JWT_SECRET=tu-secreto-jwt

4. Ejecutar el esquema SQL en tu base de datos Neon (ver `lib/schema.sql`)  
5. Iniciar en desarrollo:

npm run dev


## Uso
- Regístrate en `/register`
- Inicia sesión en `/login`
- Gestiona pacientes en `/patients`
- Crea seguimientos en `/followups`
- Revisa historial en `/history`
- Cambia tu contraseña en `/settings`

## Estructura

app/
api/
dashboard/
patients/
followups/
history/
settings/
login/
register/
layout.tsx
components/
lib/
public/


## Base de Datos

CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
full_name VARCHAR(255) NOT NULL,
age INTEGER,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS followups (
id SERIAL PRIMARY KEY,
patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
sheet_number INTEGER NOT NULL,
content TEXT NOT NULL DEFAULT '',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


## Notas
- La plantilla de ficha es solo texto editable, no se guarda en base de datos
- Cada seguimiento es independiente con su propio número de hoja
- Los PDFs se generan en el cliente con jsPDF

## Sistema de Seguimiento de Pacientes

