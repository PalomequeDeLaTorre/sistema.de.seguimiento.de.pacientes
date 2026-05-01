// app/api/export/route.ts 
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    if (type === 'stats') {
      // Obtener el rango UTC que corresponde a hoy en México
      const { startUTC, endUTC } = getMexicoDayRangeUTC();
      
      const [totalPatients, todayPatients, totalFollowups, todayFollowups] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM patients WHERE user_id = $1', [session.userId]),
        pool.query(
          'SELECT COUNT(*) FROM patients WHERE user_id = $1 AND created_at >= $2 AND created_at < $3',
          [session.userId, startUTC, endUTC]
        ),
        pool.query('SELECT COUNT(*) FROM followups WHERE user_id = $1', [session.userId]),
        pool.query(
          'SELECT COUNT(*) FROM followups WHERE user_id = $1 AND created_at >= $2 AND created_at < $3',
          [session.userId, startUTC, endUTC]
        )
      ]);

      return NextResponse.json({
        totalPatients: parseInt(totalPatients.rows[0].count),
        todayPatients: parseInt(todayPatients.rows[0].count),
        totalFollowups: parseInt(totalFollowups.rows[0].count),
        todayFollowups: parseInt(todayFollowups.rows[0].count),
      });
    }

    if (type === 'all-patients') {
      const result = await pool.query(
        `SELECT 
          id, 
          full_name, 
          age, 
          created_at,
          created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City' as created_at_local
        FROM patients 
        WHERE user_id = $1 
        ORDER BY created_at DESC`,
        [session.userId]
      );
      return NextResponse.json(result.rows);
    }

    if (type === 'all-followups') {
      const result = await pool.query(
        `SELECT 
          f.*, 
          p.full_name,
          f.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City' as created_at_local
        FROM followups f 
        JOIN patients p ON f.patient_id = p.id 
        WHERE f.user_id = $1 
        ORDER BY f.created_at DESC`,
        [session.userId]
      );
      return NextResponse.json(result.rows);
    }

    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
  } catch (error) {
    console.error('Error en /api/export:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Función auxiliar para calcular el rango UTC del día en México
function getMexicoDayRangeUTC(): { startUTC: Date; endUTC: Date } {
  // Obtener la fecha actual en México
  const now = new Date();
  const mexicoDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  
  // Crear el inicio del día en México (00:00:00)
  const startMexico = new Date(mexicoDate);
  startMexico.setHours(0, 0, 0, 0);
  
  // Crear el fin del día en México (23:59:59.999)
  const endMexico = new Date(mexicoDate);
  endMexico.setHours(23, 59, 59, 999);
  
  // Convertir a UTC usando el método correcto
  const startUTC = new Date(startMexico.toLocaleString('en-US', { timeZone: 'UTC' }));
  const endUTC = new Date(endMexico.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  return { startUTC, endUTC };
}