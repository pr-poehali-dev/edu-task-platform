const URLS = {
  auth: 'https://functions.poehali.dev/20c0cce5-cb54-4ca4-a1a8-d93cb31c4e78',
  assignments: 'https://functions.poehali.dev/62cebecf-9e87-45a6-892e-424fb0dae03d',
  solutions: 'https://functions.poehali.dev/99933982-e88c-417a-831b-ac2c2855b508',
};

export async function apiLogin(username: string, password: string) {
  const res = await fetch(URLS.auth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username, password }),
  });
  return res.json();
}

export async function apiRegister(username: string, password: string, full_name: string) {
  const res = await fetch(URLS.auth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', username, password, full_name }),
  });
  return res.json();
}

export async function apiGetAssignments(user_id: number, role: string) {
  const res = await fetch(`${URLS.assignments}?user_id=${user_id}&role=${role}`);
  return res.json();
}

export async function apiCreateAssignment(data: {
  title: string; description: string; deadline?: string; max_score: number; teacher_id: number;
}) {
  const res = await fetch(URLS.assignments, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiGetSolutions(assignment_id: number) {
  const res = await fetch(`${URLS.solutions}?assignment_id=${assignment_id}`);
  return res.json();
}

export async function apiSubmitSolution(data: {
  assignment_id: number; student_id: number; solution_text: string; answer_text: string;
}) {
  const res = await fetch(URLS.solutions, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiGradeSolution(data: {
  solution_id: number; score: number; comment: string; teacher_id: number;
}) {
  const res = await fetch(URLS.solutions, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
