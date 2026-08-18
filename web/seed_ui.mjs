import fs from 'fs';

const API_URL = 'http://127.0.0.1:8000/api';

async function apiClient(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API Error ${res.status}: ${txt}`);
  }
  if (res.status === 204) return {};
  return res.json();
}

async function run() {
  console.log("Fetching projects...");
  const projectsRes = await apiClient('/projects/');
  const projects = projectsRes.results || projectsRes;
  console.log(`Found ${projects.length} projects.`);

  console.log("Fetching users...");
  const usersRes = await apiClient('/users/');
  const users = usersRes.results || usersRes;
  console.log(`Found ${users.length} users.`);

  if (projects.length === 0 || users.length === 0) {
    throw new Error("Missing projects or users in DB.");
  }

  const userIds = users.map(u => u.id);

  const titles = [
    { title: "Authentication failure", category: "Security", priority: "CRITICAL" },
    { title: "API integration", category: "Feature", priority: "HIGH" },
    { title: "UI bug in Dashboard", category: "Bug", priority: "MEDIUM" },
    { title: "Database issue with stale queries", category: "Infrastructure", priority: "CRITICAL" },
    { title: "Deployment issue in CI/CD", category: "Operational", priority: "HIGH" },
    { title: "Mobile responsiveness in Kanban", category: "Bug", priority: "LOW" },
    { title: "Performance degradation on load", category: "Performance", priority: "HIGH" },
    { title: "Security review for Phase 6", category: "Security review", priority: "MEDIUM" }
  ];

  console.log("Creating work items...");
  const createdItems = [];
  for (let i = 0; i < titles.length; i++) {
    const p = projects[i % projects.length];
    const itemData = {
      title: titles[i].title,
      description: `Description for ${titles[i].title}`,
      priority: titles[i].priority,
      project: p.id,
      category: titles[i].category,
      assigned_to: userIds[i % userIds.length],
      reported_by: userIds[0]
    };
    const created = await apiClient('/work-items/', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    createdItems.push(created);
    console.log(`Created: ${created.reference_number} - ${created.title}`);
  }

  console.log("Adding Comments...");
  for (const item of createdItems.slice(0, 3)) {
    await apiClient(`/work-items/${item.id}/comments/`, {
      method: 'POST',
      body: JSON.stringify({
        message: `This is a comment added to ${item.reference_number}`,
        author: userIds[1]
      })
    });
    console.log(`Commented on ${item.reference_number}`);
  }

  console.log("Transitioning Work Items...");
  // Transition first item to IN_PROGRESS
  await apiClient(`/work-items/${createdItems[0].id}/transition/`, {
    method: 'POST',
    body: JSON.stringify({ status: 'IN_PROGRESS' })
  });
  console.log(`${createdItems[0].reference_number} transitioned to IN_PROGRESS`);

  // Transition second item to IN_PROGRESS, then REVIEW
  await apiClient(`/work-items/${createdItems[1].id}/transition/`, {
    method: 'POST',
    body: JSON.stringify({ status: 'IN_PROGRESS' })
  });
  await apiClient(`/work-items/${createdItems[1].id}/transition/`, {
    method: 'POST',
    body: JSON.stringify({ status: 'REVIEW' })
  });
  console.log(`${createdItems[1].reference_number} transitioned to REVIEW`);

  // Transition third item to RESOLVED
  await apiClient(`/work-items/${createdItems[2].id}/transition/`, {
    method: 'POST',
    body: JSON.stringify({ status: 'IN_PROGRESS' })
  });
  await apiClient(`/work-items/${createdItems[2].id}/transition/`, {
    method: 'POST',
    body: JSON.stringify({ status: 'REVIEW' })
  });
  // Needs resolution_note before resolve
  await apiClient(`/work-items/${createdItems[2].id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ resolution_note: "Fixed in production." })
  });
  await apiClient(`/work-items/${createdItems[2].id}/transition/`, {
    method: 'POST',
    body: JSON.stringify({ status: 'RESOLVED' })
  });
  console.log(`${createdItems[2].reference_number} transitioned to RESOLVED`);

  console.log("All API verifications passed and database seeded!");
}

run().catch(console.error);
