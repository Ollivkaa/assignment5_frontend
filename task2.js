'use strict';


const WIP_LIMIT = 3;        
const MIN_TITLE_LENGTH = 3; 

const STATUSES = [
  { key: 'todo', label: 'To do' },
  { key: 'doing', label: 'In progress' },
  { key: 'done', label: 'Done' },
];

const PRIORITY_LABELS = { 1: 'High', 2: 'Medium', 3: 'Low' };
const TAGS = ['design', 'code', 'content'];

 
const tasks = [
  { id: 1,  title: 'Design the logo',            priority: 1, tag: 'design',  hours: 3, urgent: true,  status: 'todo' },
  { id: 2,  title: 'Write the home page HTML',   priority: 1, tag: 'code',    hours: 4, urgent: false, status: 'doing' },
  { id: 3,  title: 'Choose the color palette',   priority: 2, tag: 'design',  hours: 1, urgent: false, status: 'done' },
  { id: 4,  title: 'Style the navigation bar',   priority: 2, tag: 'code',    hours: 2, urgent: false, status: 'todo' },
  { id: 5,  title: 'Write the About text',       priority: 3, tag: 'content', hours: 2, urgent: false, status: 'todo' },
  { id: 6,  title: 'Add the contact form',       priority: 1, tag: 'code',    hours: 5, urgent: true,  status: 'doing' },
  { id: 7,  title: 'Take product photos',        priority: 2, tag: 'content', hours: 6, urgent: false, status: 'todo' },
  { id: 8,  title: 'Make the site responsive',   priority: 1, tag: 'code',    hours: 4, urgent: true,  status: 'todo' },
  { id: 9,  title: 'Proofread all pages',        priority: 3, tag: 'content', hours: 1, urgent: false, status: 'todo' },
  { id: 10, title: 'Draw the icons',             priority: 3, tag: 'design',  hours: 3, urgent: false, status: 'done' },
  { id: 11, title: 'Test in different browsers', priority: 2, tag: 'code',    hours: 2, urgent: false, status: 'todo' },
  { id: 12, title: 'Publish on GitHub Pages',    priority: 1, tag: 'code',    hours: 1, urgent: true,  status: 'todo' },
];


const view = { tag: 'all', query: '', sortByPriority: false };

const board = document.getElementById('board');
const searchInput = document.getElementById('search');
const tagFilter = document.getElementById('tag-filter');
const sortSelect = document.getElementById('sort-select');
const addForm = document.getElementById('add-form');
const newTitle = document.getElementById('new-title');
const newPriority = document.getElementById('new-priority');
const newTag = document.getElementById('new-tag');
const messageEl = document.getElementById('message');
const nothingFound = document.getElementById('nothing-found');
const progress = document.getElementById('progress');
const progressText = document.getElementById('progress-text');

let message = { text: 'Ready. Move a card with the buttons.', type: 'info' };


function setMessage(text, type) {
  message = { text, type };
}

function findTask(id) {
  return tasks.find((task) => task.id === id);
}


function countByStatus(status) {
  let count = 0;
  for (const task of tasks) {
    if (task.status === status) {
      count += 1;
    }
  }
  return count;
}

function calculateStats() {
  let done = 0;
  let hoursLeft = 0;
  for (const task of tasks) {
    if (task.status === 'done') {
      done += 1;
    } else {
      hoursLeft += task.hours;
    }
  }
  return { total: tasks.length, done, hoursLeft };
}


function getNextId() {
  let max = 0;
  for (const task of tasks) {
    if (task.id > max) {
      max = task.id;
    }
  }
  return max + 1;
}

function getVisibleTasks() {
  const query = view.query.trim().toLowerCase();
  let list = tasks.filter((task) => {
    const tagOk = view.tag === 'all' || task.tag === view.tag;
    const textOk = query === '' || task.title.toLowerCase().includes(query);
    return tagOk && textOk;
  });
  if (view.sortByPriority) {
    list = [...list].sort((a, b) => a.priority - b.priority);
  }
  return list;
}

function moveTask(id, direction) {
  const task = findTask(id);
  if (!task) {
    setMessage('Card not found.', 'error');
    render();
    return;
  }

  const index = STATUSES.findIndex((status) => status.key === task.status);
  const target = STATUSES[index + direction];

  if (!target) {
    setMessage(`"${task.title}" cannot move further in that direction.`, 'error');
    render();
    return;
  }

  
  if (target.key === 'doing' && countByStatus('doing') >= WIP_LIMIT) {
    setMessage(`Blocked: "In progress" already has ${WIP_LIMIT} cards. Finish one first.`, 'error');
    render();
    return;
  }

  task.status = target.key;
  setMessage(`"${task.title}" moved to ${target.label}.`, 'ok');
  render();
}

function addTask(title, priority, tag) {
  tasks.push({
    id: getNextId(),
    title,
    priority,
    tag,
    hours: 1,
    urgent: priority === 1,
    status: 'todo',
  });
  setMessage(`Card "${title}" added to To do.`, 'ok');
  render();
}

function createButton(label, ariaLabel, action, id, disabled) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'arrow-btn';
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  button.dataset.action = action;
  button.dataset.id = String(id);
  button.disabled = disabled;
  return button;
}

function createCard(task) {
  const card = document.createElement('article');
  card.classList.add('task', `p${task.priority}`);
  card.classList.toggle('is-done', task.status === 'done');

  const title = document.createElement('h3');
  title.className = 'task-title';
  if (task.urgent) {
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = '★ ';
    title.append(star);
  }
  title.append(task.title);

  const meta = document.createElement('p');
  meta.className = 'task-meta';
  meta.textContent = `${task.tag} · ${PRIORITY_LABELS[task.priority]} priority · ${task.hours} h`;

  const statusIndex = STATUSES.findIndex((status) => status.key === task.status);
  const actions = document.createElement('div');
  actions.className = 'task-actions';
  actions.append(
    createButton('←', `Move "${task.title}" back`, 'prev', task.id, statusIndex === 0),
    createButton('→', `Move "${task.title}" forward`, 'next', task.id, statusIndex === STATUSES.length - 1)
  );

  card.append(title, meta, actions);
  return card;
}


function render() {
  const visible = getVisibleTasks();
  const filtering = view.tag !== 'all' || view.query.trim() !== '';

  for (const status of STATUSES) {
    const container = document.getElementById(`col-${status.key}`);
    const inColumn = visible.filter((task) => task.status === status.key);
    container.replaceChildren();

    for (const task of inColumn) {
      container.append(createCard(task));
    }
    if (inColumn.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = filtering ? 'No cards match the filter.' : 'No cards here yet.';
      container.append(empty);
    }

    const total = countByStatus(status.key);
    const countEl = document.getElementById(`count-${status.key}`);
    countEl.textContent = status.key === 'doing' ? `${total}/${WIP_LIMIT}` : String(total);

    if (status.key === 'doing') {
      container.parentElement.classList.toggle('is-full', total >= WIP_LIMIT);
    }
  }

  
  nothingFound.hidden = visible.length !== 0;
  nothingFound.textContent = 'Nothing found. Change the search or the tag filter.';

  const stats = calculateStats();
  progress.max = stats.total;
  progress.value = stats.done;
  progressText.textContent =
    `${stats.done} of ${stats.total} cards done · ${stats.hoursLeft} h left`;

  messageEl.textContent = message.text;
  messageEl.className = `message message--${message.type}`;

  sortSelect.value = view.sortByPriority ? 'high' : 'default';
  newTitle.classList.remove('is-invalid');
}


function fillSelect(select, includeAll) {
  select.replaceChildren();
  if (includeAll) {
    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'All tags';
    select.append(all);
  }
  for (const tag of TAGS) {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = `#${tag}`;
    select.append(option);
  }
}

board.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !board.contains(button)) {
    return;
  }
  const id = Number(button.dataset.id);
  moveTask(id, button.dataset.action === 'next' ? 1 : -1);
});

searchInput.addEventListener('input', () => {
  view.query = searchInput.value;
  render();
});

tagFilter.addEventListener('change', () => {
  view.tag = tagFilter.value;
  render();
});

sortSelect.addEventListener('change', () => {
  view.sortByPriority = sortSelect.value === 'high';
  render();
});

addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = newTitle.value.trim();
  if (title.length < MIN_TITLE_LENGTH) {
    setMessage(`Title must have at least ${MIN_TITLE_LENGTH} characters.`, 'error');
    render();
    newTitle.classList.add('is-invalid');
    newTitle.focus();
    return;
  }
  addTask(title, Number(newPriority.value), newTag.value);
  newTitle.value = '';
});

fillSelect(tagFilter, true);
fillSelect(newTag, false);
render();
