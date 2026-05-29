const AUTH = 'https://functions.poehali.dev/20c0cce5-cb54-4ca4-a1a8-d93cb31c4e78';
const ASSIGNMENTS = 'https://functions.poehali.dev/62cebecf-9e87-45a6-892e-424fb0dae03d';
const SOLUTIONS = 'https://functions.poehali.dev/99933982-e88c-417a-831b-ac2c2855b508';

async function post(url: string, body: object) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

export const apiLogin = (username: string, password: string) =>
  post(AUTH, { action: 'login', username, password });

export const apiCreateStudent = (username: string, password: string, full_name: string) =>
  post(AUTH, { action: 'create_student', username, password, full_name });

export const apiGetStudents = () =>
  post(AUTH, { action: 'get_students' });

export const apiGetAssignments = async (user_id: number, role: string) => {
  const res = await fetch(`${ASSIGNMENTS}?user_id=${user_id}&role=${role}`);
  return res.json();
};

export const apiCreateAssignment = (data: object) =>
  post(ASSIGNMENTS, data);

export const apiGetSolutions = async (assignment_id: number) => {
  const res = await fetch(`${SOLUTIONS}?assignment_id=${assignment_id}`);
  return res.json();
};

export const apiSubmitSolution = (data: object) =>
  post(SOLUTIONS, data);

export const apiGradeSolution = (data: object) =>
  fetch(SOLUTIONS, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());