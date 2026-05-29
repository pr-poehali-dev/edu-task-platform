import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Управление решениями студентов и выставление оценок учителем"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
        'Content-Type': 'application/json'
    }
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod')
    params = event.get('queryStringParameters') or {}
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        assignment_id = params.get('assignment_id')
        cur.execute("""
            SELECT s.id, s.solution_text, s.answer_text, s.submitted_at,
                   u.full_name, u.username,
                   g.score, g.comment, g.graded_at
            FROM solutions s
            JOIN users u ON u.id = s.student_id
            LEFT JOIN grades g ON g.solution_id = s.id
            WHERE s.assignment_id = %s
            ORDER BY s.submitted_at DESC
        """, (assignment_id,))
        rows = cur.fetchall()
        conn.close()
        result = [{'id': r[0], 'solution_text': r[1], 'answer_text': r[2],
                   'submitted_at': r[3].isoformat(),
                   'student_name': r[4], 'student_username': r[5],
                   'score': r[6], 'comment': r[7],
                   'graded_at': r[8].isoformat() if r[8] else None} for r in rows]
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'solutions': result})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        assignment_id = body.get('assignment_id')
        student_id = body.get('student_id')
        solution_text = body.get('solution_text', '').strip()
        answer_text = body.get('answer_text', '').strip()
        if not solution_text:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Введите решение'})}
        cur.execute("""
            INSERT INTO solutions (assignment_id, student_id, solution_text, answer_text)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (assignment_id, student_id)
            DO UPDATE SET solution_text = EXCLUDED.solution_text, answer_text = EXCLUDED.answer_text, submitted_at = NOW()
            RETURNING id
        """, (assignment_id, student_id, solution_text, answer_text))
        sol_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'solution_id': sol_id})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        solution_id = body.get('solution_id')
        score = body.get('score')
        comment = body.get('comment', '')
        teacher_id = body.get('teacher_id')
        cur.execute("""
            INSERT INTO grades (solution_id, score, comment, graded_by)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (solution_id)
            DO UPDATE SET score = EXCLUDED.score, comment = EXCLUDED.comment, graded_at = NOW(), graded_by = EXCLUDED.graded_by
        """, (solution_id, score, comment, teacher_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Метод не поддерживается'})}
