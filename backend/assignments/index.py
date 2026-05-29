import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """CRUD для заданий: создание, список, удаление"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        user_id = params.get('user_id')
        role = params.get('role')
        if role == 'teacher':
            cur.execute("""
                SELECT a.id, a.title, a.description, a.deadline, a.max_score, a.created_at,
                       COUNT(DISTINCT s.id) as solutions_count
                FROM assignments a
                LEFT JOIN solutions s ON s.assignment_id = a.id
                WHERE a.teacher_id = %s
                GROUP BY a.id ORDER BY a.created_at DESC
            """, (user_id,))
        else:
            cur.execute("""
                SELECT a.id, a.title, a.description, a.deadline, a.max_score, a.created_at,
                       s.id as solution_id, s.submitted_at,
                       g.score, g.comment
                FROM assignments a
                LEFT JOIN solutions s ON s.assignment_id = a.id AND s.student_id = %s
                LEFT JOIN grades g ON g.solution_id = s.id
                ORDER BY a.created_at DESC
            """, (user_id,))
        rows = cur.fetchall()
        conn.close()
        if role == 'teacher':
            result = [{'id': r[0], 'title': r[1], 'description': r[2],
                       'deadline': r[3].isoformat() if r[3] else None,
                       'max_score': r[4], 'created_at': r[5].isoformat(),
                       'solutions_count': r[6]} for r in rows]
        else:
            result = [{'id': r[0], 'title': r[1], 'description': r[2],
                       'deadline': r[3].isoformat() if r[3] else None,
                       'max_score': r[4], 'created_at': r[5].isoformat(),
                       'solution_id': r[6],
                       'submitted_at': r[7].isoformat() if r[7] else None,
                       'score': r[8], 'comment': r[9]} for r in rows]
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'assignments': result})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        title = body.get('title', '').strip()
        description = body.get('description', '').strip()
        deadline = body.get('deadline')
        max_score = body.get('max_score', 100)
        teacher_id = body.get('teacher_id')
        if not title or not description:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Заполните название и описание'})}
        cur.execute(
            "INSERT INTO assignments (title, description, deadline, max_score, teacher_id) VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at",
            (title, description, deadline if deadline else None, max_score, teacher_id)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'assignment': {'id': row[0], 'title': title, 'created_at': row[1].isoformat()}})}

    if method == 'DELETE':
        assignment_id = params.get('id')
        cur.execute("UPDATE solutions SET assignment_id = NULL WHERE assignment_id = %s", (assignment_id,))
        cur.execute("UPDATE assignments SET teacher_id = NULL WHERE id = %s", (assignment_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Метод не поддерживается'})}
