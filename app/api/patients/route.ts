// app/api/patients/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  full_name: z.string().min(1),
  age: z.number().min(0).max(150).nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // 🔥 CONVERTIR created_at a hora de México
    const result = await pool.query(
      `SELECT 
        id, 
        full_name, 
        age, 
        created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City' as created_at
      FROM patients 
      WHERE user_id = $1 
      ORDER BY created_at DESC`,
      [session.userId]
    );
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { full_name, age } = parsed.data;

    // 🔥 Insertar y devolver la fecha convertida
    const result = await pool.query(
      `INSERT INTO patients (user_id, full_name, age, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING 
         id, 
         full_name, 
         age, 
         created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City' as created_at`,
      [session.userId, full_name, age]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}