// app/api/followups/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  patient_id: z.number(),
  content: z.string(),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patient_id');

  try {
    let query = `
      SELECT 
        f.*, 
        p.full_name,
        f.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City' as created_at
      FROM followups f 
      JOIN patients p ON f.patient_id = p.id 
      WHERE f.user_id = $1
    `;
    let params = [session.userId];

    if (patientId) {
      query += ' AND f.patient_id = $2';
      params.push(patientId);
    }

    query += ' ORDER BY f.created_at DESC';

    const result = await pool.query(query, params);
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

    const { patient_id, content } = parsed.data;

    // Verificar que el paciente pertenece al usuario
    const patientCheck = await pool.query(
      'SELECT id FROM patients WHERE id = $1 AND user_id = $2',
      [patient_id, session.userId]
    );

    if (patientCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Obtener el siguiente número de hoja
    const sheetResult = await pool.query(
      'SELECT COALESCE(MAX(sheet_number), 0) + 1 as next_sheet FROM followups WHERE patient_id = $1',
      [patient_id]
    );

    const sheetNumber = sheetResult.rows[0].next_sheet;

    // 🔥 Insertar y devolver la fecha convertida
    const result = await pool.query(
      `INSERT INTO followups (patient_id, user_id, sheet_number, content, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING 
         *, 
         created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City' as created_at`,
      [patient_id, session.userId, sheetNumber, content]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}