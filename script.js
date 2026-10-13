const destinationSelect = document.getElementById('destinationSelect');
const travelMonth = document.getElementById('travelMonth');
const tourCards = Array.from(document.querySelectorAll('.tour-card'));
const noResults = document.getElementById('noResults');

function filterTours() {
  const destination = destinationSelect.value.trim().toLowerCase();
  const selectedMonth = travelMonth.value; // YYYY-MM
  let visible = 0;

  tourCards.forEach(card => {
    const cardDestination = (card.dataset.destination || '').trim().toLowerCase();
    const dateText = card.querySelector('.tour-details span')?.textContent || '';
    const parsedDate = new Date(dateText.split(' · ')[0]);
    const cardMonth = Number.isNaN(parsedDate.getTime())
      ? ''
      : `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
    const matchesDestination = !destination || cardDestination === destination;
    const matchesMonth = !selectedMonth || !cardMonth || cardMonth === selectedMonth;
    const show = matchesDestination && matchesMonth;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  noResults.style.display = visible ? 'none' : 'block';
}

document.getElementById('searchForm').addEventListener('submit', event => {
  event.preventDefault();
  filterTours();
  document.getElementById('tours').scrollIntoView({ behavior: 'smooth' });
});
destinationSelect.addEventListener('change', filterTours);
travelMonth.addEventListener('change', filterTours);

// Clicking a destination shows only tours belonging to that destination.
document.querySelectorAll('.destination-card a[data-destination]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    destinationSelect.value = link.dataset.destination;
    filterTours();
    document.getElementById('tours').scrollIntoView({ behavior: 'smooth' });
  });
});

// Demo tour details and slot check.
document.querySelectorAll('.book-btn').forEach(button => {
  button.addEventListener('click', () => {
    const tour = button.dataset.tour;
    const price = Number(button.dataset.price);
    const availableSlots = Number(button.dataset.slots);
    const peopleInput = prompt('How many travelers? Enter a number from 1 to ' + availableSlots + '.');
    if (peopleInput === null) return;
    const people = Number(peopleInput);
    if (!Number.isInteger(people) || people < 1) {
      alert('Please enter a valid number of travelers.');
      return;
    }
    if (people > availableSlots) {
      alert("You've exceeded the limit slot available");
      return;
    }
    alert('Tour: ' + tour + '\\n' + 'Travelers: ' + people + '\\n' +
      'Estimated total: ₱' + (price * people).toLocaleString('en-PH'));
  });
});

// Schedule + available-slot CRUD. This demo keeps changes in page memory only.
const scheduleList = document.getElementById('scheduleList');
const scheduleForm = document.getElementById('scheduleForm');
const emptySchedules = document.getElementById('emptySchedules');
const scheduleDate = document.getElementById('scheduleDate');
const scheduleTime = document.getElementById('scheduleTime');
let nextScheduleId = 1;

function dateToInput(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function displayDate(dateString) {
  if (!dateString) return 'Date not set';
  return new Date(dateString + 'T12:00:00').toLocaleDateString('en-PH', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}
function displayTime(timeString) {
  if (!timeString) return 'Time not set';
  const [hours, minutes] = timeString.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

const schedules = tourCards.map(card => {
  const title = card.querySelector('h3').textContent.trim();
  const detailDate = card.querySelector('.tour-details span')?.textContent.split(' · ')[0] || '';
  const detailTime = card.querySelector('.tour-details span')?.textContent.split(' · ')[1] || '09:00';
  const meta = card.querySelector('.tour-meta').textContent;
  const slotsMatch = meta.match(/(\\d+) slots available/);
  return {
    id: nextScheduleId++,
    tour: title,
    destination: card.dataset.destination || '',
    date: dateToInput(detailDate),
    time: detailTime.trim(),
    price: Number(card.querySelector('.book-btn').dataset.price || 0),
    slots: Number(slotsMatch?.[1] || card.querySelector('.book-btn').dataset.slots || 0)
  };
});

function renderSchedules() {
  scheduleList.innerHTML = '';
  emptySchedules.style.display = schedules.length ? 'none' : 'block';
  schedules.forEach(item => {
    const article = document.createElement('article');
    article.className = 'schedule-item';

    const main = document.createElement('div');
    main.className = 'schedule-main';
    const title = document.createElement('h3');
    title.textContent = item.tour;
    const details = document.createElement('p');
    details.textContent = `${item.destination} · ${displayDate(item.date)} · ${displayTime(item.time)} · ₱${item.price.toLocaleString('en-PH')} per person`;
    const meta = document.createElement('div');
    meta.className = 'schedule-meta';
    const slotPill = document.createElement('span');
    slotPill.className = 'slots';
    slotPill.textContent = `${item.slots} slots available`;
    meta.appendChild(slotPill);
    main.append(title, details, meta);

    const actions = document.createElement('div');
    actions.className = 'schedule-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-small';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openScheduleForm(item));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn-small btn-danger';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => {
      if (!confirm(`Delete the schedule for "${item.tour}"?`)) return;
      const index = schedules.findIndex(schedule => schedule.id === item.id);
      if (index !== -1) schedules.splice(index, 1);
      renderSchedules();
    });
    actions.append(edit, remove);
    article.append(main, actions);
    scheduleList.appendChild(article);
  });
}

function openScheduleForm(item = null) {
  scheduleForm.hidden = false;
  document.getElementById('scheduleFormTitle').textContent = item ? 'Edit schedule' : 'Add a schedule';
  document.getElementById('scheduleId').value = item ? String(item.id) : '';
  document.getElementById('scheduleTour').value = item?.tour || '';
  document.getElementById('scheduleDestination').value = item?.destination || '';
  scheduleDate.value = item?.date || '';
  scheduleTime.value = item?.time || '';
  document.getElementById('schedulePrice').value = item?.price ?? '';
  document.getElementById('scheduleSlots').value = item?.slots ?? '';
  document.getElementById('saveScheduleBtn').textContent = item ? 'Save changes' : 'Save schedule';
  scheduleForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('scheduleTour').focus();
}

document.getElementById('addScheduleBtn').addEventListener('click', () => openScheduleForm());
document.getElementById('cancelScheduleBtn').addEventListener('click', () => {
  scheduleForm.reset();
  scheduleForm.hidden = true;
});
scheduleForm.addEventListener('submit', event => {
  event.preventDefault();
  const idValue = document.getElementById('scheduleId').value;
  const price = Number(document.getElementById('schedulePrice').value);
  const slots = Number(document.getElementById('scheduleSlots').value);
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(slots) || slots < 0) {
    alert('Price must be zero or more, and available slots must be a whole number zero or more.');
    return;
  }
  const record = {
    id: idValue ? Number(idValue) : nextScheduleId++,
    tour: document.getElementById('scheduleTour').value.trim(),
    destination: document.getElementById('scheduleDestination').value,
    date: scheduleDate.value,
    time: scheduleTime.value,
    price,
    slots
  };
  if (idValue) {
    const index = schedules.findIndex(item => item.id === Number(idValue));
    if (index !== -1) schedules[index] = record;
  } else {
    schedules.push(record);
  }
  renderSchedules();
  scheduleForm.reset();
  scheduleForm.hidden = true;
});
renderSchedules();
filterTours();
