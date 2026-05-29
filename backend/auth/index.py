import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Авторизация пользователей: вход и регистрация студентов"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
        'Content-Type': 'application/json'
    }
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if action == 'login':
        username = body.get('username', '').strip()
        password = body.get('password', '').strip()
        cur.execute(
            "SELECT id, username, full_name, role FROM users WHERE username = %s AND password_hash = %s",
            (username, password)
        )
        row = cur.fetchone()
        conn.close()
        if row:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'user': {'id': row[0], 'username': row[1], 'full_name': row[2], 'role': row[3]}})
            }
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Неверный логин или пароль'})}

    if action == 'create_student':
        username = body.get('username', '').strip()
        password = body.get('password', '').strip()
        full_name = body.get('full_name', '').strip()
        if not username or not password or not full_name:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Заполните все поля'})}
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            conn.close()
            return {'statusCode': 409, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Логин уже занят'})}
        cur.execute(
            "INSERT INTO users (username, password_hash, full_name, role) VALUES (%s, %s, %s, 'student') RETURNING id",
            (username, password, full_name)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {
            'statusCode': 200, 'headers': headers,
            'body': json.dumps({'success': True, 'user': {'id': new_id, 'username': username, 'full_name': full_name, 'role': 'student'}})
        }

    if action == 'get_students':
        cur.execute("SELECT id, username, full_name FROM users WHERE role = 'student' ORDER BY full_name")
        rows = cur.fetchall()
        conn.close()
        return {
            'statusCode': 200, 'headers': headers,
            'body': json.dumps({'success': True, 'students': [{'id': r[0], 'username': r[1], 'full_name': r[2]} for r in rows]})
        }

    conn.close()
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Неизвестное действие'})}