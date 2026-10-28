'use strict';

const EVENTS = [
  { id: 'rock', name: 'Rock Night' },
  { id: 'tech', name: 'Tech Conference' },
  { id: 'film', name: 'Film Festival' },
];

const TICKET_TYPES = [
  { id: 'standard', name: 'Standard', price: 50, left: 20 },
  { id: 'vip', name: 'VIP', price: 120, left: 5 },
  { id: 'student', name: 'Student', price: 30, left: 8 },
];

const SOLD_OUT_DATES = ['2026-11-15', '2026-12-31'];

const PROMO_CODES = [
  { code: 'SAVE10', percent: 10 },
  { code: 'STUDENT20', percent: 20 },
];

const BLOCKED_EMAIL_DOMAINS = ['mailinator.com', 'tempmail.com', '10minutemail.com'];

const NAME_PATTERN = /^[A-Za-zА-Яа-яЁё]+(?:[ '-][A-Za-zА-Яа-яЁё]+)+$/;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;


const form = document.getElementById('ticket-form');
const summary = document.getElementById('summary');
const preview = document.getElementById('preview');
const result = document.getElementById('result');
const fields = Array.from(form.elements).filter(
  (control) => control.tagName === 'INPUT' || control.tagName === 'SELECT'
);

form.noValidate = true;
const touched = new Set();


function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeBookingCode() {
  let code = 'TKT-';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARS[randomInt(0, CODE_CHARS.length - 1)];
  }
  return code;
}

function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const findEvent = (id) => EVENTS.find((e) => e.id === id);
const findType = (id) => TICKET_TYPES.find((t) => t.id === id);
const findPromo = (code) => PROMO_CODES.find((p) => p.code === code.trim().toUpperCase());

const rules = {
  date(control) {
    const value = control.value;
    if (value === '') return '';
    if (value < todayISO()) return 'The date is in the past. Choose today or later.';
    if (SOLD_OUT_DATES.includes(value)) return 'Tickets for this date are sold out.';
    return '';
  },
  qty(control) {
    const type = findType(form.elements.ticketType.value);
    const quantity = Number(control.value);
    if (type && control.value !== '' && quantity > type.left) {
      return type.left === 0
        ? `${type.name} tickets are sold out.`
        : `Only ${type.left} ${type.name} ticket(s) left.`;
    }
    return '';
  },
  fullName(control) {
    const value = control.value.trim();
    if (value !== '' && !NAME_PATTERN.test(value)) {
      return 'Enter first and last name, letters only.';
    }
    return '';
  },
  email(control) {
    const domain = control.value.trim().toLowerCase().split('@')[1];
    if (domain && BLOCKED_EMAIL_DOMAINS.includes(domain)) {
      return 'Temporary email domains are not allowed.';
    }
    return '';
  },
  promo(control) {
    const value = control.value.trim();
    if (value !== '' && !findPromo(value)) {
      return 'Unknown promo code.';
    }
    return '';
  },
};


function getMessage(control) {
  control.setCustomValidity('');
  const validity = control.validity;

  if (validity.valueMissing) return 'This field is required.';
  if (validity.typeMismatch) return 'Enter a valid email, e.g. name@example.com.';
  if (validity.tooShort) return `Enter at least ${control.minLength} characters.`;

  const custom = rules[control.name] ? rules[control.name](control) : '';
  if (custom !== '') {
    control.setCustomValidity(custom);
    return custom;
  }

  if (validity.badInput || validity.rangeUnderflow || validity.rangeOverflow) {
    return control.type === 'number'
      ? `Enter a whole number from ${control.min} to ${control.max}.`
      : 'Enter a valid value.';
  }
  return '';
}

function validateField(control) {
  const message = getMessage(control);
  const errorEl = document.getElementById(`err-${control.name}`);
  errorEl.textContent = message;
  control.setAttribute('aria-invalid', message === '' ? 'false' : 'true');
  control.classList.toggle('is-invalid', message !== '');
  control.classList.toggle('is-valid', message === '' && control.value !== '');
  return message === '';
}

function clearValidationState() {
  touched.clear();
  for (const control of fields) {
    control.removeAttribute('aria-invalid');
    control.classList.remove('is-invalid', 'is-valid');
    control.setCustomValidity('');
    document.getElementById(`err-${control.name}`).textContent = '';
  }
  summary.hidden = true;
  summary.textContent = '';
}

function addRow(list, label, value) {
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  list.append(dt, dd);
}

function calculateTotal(type, quantity, promoText) {
  if (!type || !(quantity > 0)) return { total: 0, discount: 0 };
  const subtotal = type.price * quantity;
  const promo = promoText.trim() === '' ? null : findPromo(promoText);
  const discount = promo ? Math.round(subtotal * promo.percent) / 100 : 0;
  return { total: subtotal - discount, discount };
}

function renderPreview() {
  const values = form.elements;
  const event = findEvent(values.eventId.value);
  const type = findType(values.ticketType.value);
  const quantity = Number(values.qty.value);
  const { total, discount } = calculateTotal(type, quantity, values.promo.value);

  preview.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = event ? event.name : 'Your event';
  const list = document.createElement('dl');
  addRow(list, 'Date', values.date.value || '—');
  addRow(list, 'Type', type ? type.name : '—');
  addRow(list, 'Quantity', quantity > 0 ? String(quantity) : '—');
  addRow(list, 'Name', values.fullName.value.trim() || '—');
  addRow(list, 'Email', values.email.value.trim() || '—');
  if (discount > 0) addRow(list, 'Discount', `-$${discount.toFixed(2)}`);
  addRow(list, 'Total', `$${total.toFixed(2)}`);
  preview.append(title, list);
}

function refreshTypeOptions() {
  for (const option of form.elements.ticketType.options) {
    const type = findType(option.value);
    if (type) {
      option.textContent = `${type.name} — $${type.price} (${type.left} left)`;
      option.disabled = type.left === 0;
    }
  }
}

function showTicket(data) {
  const ticket = document.createElement('article');
  ticket.className = 'ticket is-success';

  const title = document.createElement('h2');
  title.textContent = 'Booking confirmed';
  title.tabIndex = -1;

  const code = document.createElement('p');
  code.className = 'code';
  code.textContent = data.code;

  const list = document.createElement('dl');
  addRow(list, 'Event', data.eventName);
  addRow(list, 'Date', data.date);
  addRow(list, 'Type', data.typeName);
  addRow(list, 'Quantity', String(data.quantity));
  addRow(list, 'Name', data.name);
  addRow(list, 'Email', data.email);
  addRow(list, 'Paid', `$${data.total.toFixed(2)}`);

  ticket.append(title, code, list);
  result.replaceChildren(ticket);
  title.focus();
}


form.addEventListener('focusout', (event) => {
  const control = event.target;
  if (!fields.includes(control)) return;
  touched.add(control.name);
  validateField(control);
});

function handleChange(event) {
  const control = event.target;
  if (!fields.includes(control)) return;
  renderPreview();
  if (touched.has(control.name)) validateField(control);

  if (control.name === 'ticketType' && touched.has('qty')) {
    validateField(form.elements.qty);
  }
}
form.addEventListener('input', handleChange);
form.addEventListener('change', handleChange);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  let errorCount = 0;
  let firstInvalid = null;
  for (const control of fields) {
    touched.add(control.name);
    if (!validateField(control)) {
      errorCount += 1;
      if (firstInvalid === null) firstInvalid = control;
    }
  }

  if (errorCount > 0) {
    summary.textContent =
      `${errorCount} ${errorCount === 1 ? 'error' : 'errors'} found. Please fix the highlighted fields.`;
    summary.hidden = false;
    firstInvalid.focus();
    return;
  }

  const values = form.elements;
  const type = findType(values.ticketType.value);
  const quantity = Number(values.qty.value);
  const { total } = calculateTotal(type, quantity, values.promo.value);

  const data = {
    code: makeBookingCode(),
    eventName: findEvent(values.eventId.value).name,
    date: values.date.value,
    typeName: type.name,
    quantity,
    name: values.fullName.value.trim(),
    email: values.email.value.trim(),
    total,
  };

  type.left -= quantity; 
  form.reset();
  clearValidationState();
  refreshTypeOptions();
  renderPreview();
  showTicket(data);
});

form.addEventListener('reset', () => {
  
  setTimeout(() => {
    clearValidationState();
    renderPreview();
  }, 0);
});


function fillSelect(select, items) {
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.append(option);
  }
}

fillSelect(form.elements.eventId, EVENTS);
fillSelect(form.elements.ticketType, TICKET_TYPES);
form.elements.date.min = todayISO();
refreshTypeOptions();
renderPreview();
