// ===== ДАННЫЕ =====
const CARS_DB = [
  { name: "ВАЗ 2107", emoji: "🚗", basePrice: 45000, reliability: 0.7 },
  { name: "ВАЗ 2110", emoji: "🚙", basePrice: 80000, reliability: 0.65 },
  { name: "ГАЗ 3110", emoji: "🚕", basePrice: 70000, reliability: 0.6 },
  { name: "Ford Focus", emoji: "🚘", basePrice: 180000, reliability: 0.85 },
  { name: "Toyota Corolla", emoji: "🚗", basePrice: 250000, reliability: 0.95 },
  { name: "Honda Civic", emoji: "🏎️", basePrice: 220000, reliability: 0.9 },
  { name: "BMW E36", emoji: "🚙", basePrice: 300000, reliability: 0.75 },
  { name: "Audi A4", emoji: "🚘", basePrice: 350000, reliability: 0.8 },
  { name: "Mercedes W124", emoji: "🚕", basePrice: 320000, reliability: 0.85 },
  { name: "Kia Rio", emoji: "🚗", basePrice: 200000, reliability: 0.9 },
  { name: "Hyundai Solaris", emoji: "🚙", basePrice: 210000, reliability: 0.9 },
  { name: "Renault Logan", emoji: "🚘", basePrice: 150000, reliability: 0.8 },
  { name: "Chevrolet Lacetti", emoji: "🚕", basePrice: 170000, reliability: 0.75 },
  { name: "Nissan Skyline", emoji: "🏎️", basePrice: 600000, reliability: 0.7 },
  { name: "Mazda 6", emoji: "🚗", basePrice: 400000, reliability: 0.85 },
];

const TUTORIAL_STEPS = [
  { title: "Добро пожаловать!", text: "Ты — перекуп авто. У тебя есть 10 000 ₽ стартового капитала. Купи первую машину на Рынке!" },
  { title: "Рынок", text: "Здесь появляются машины. У каждой есть цена, состояние и год. Чем хуже состояние — тем дешевле, но больше ремонта." },
  { title: "Гараж", text: "Купленные машины хранятся в Гараже. Тут их можно отремонтировать и продать дороже." },
  { title: "Ремонт", text: "Чем лучше состояние машины — тем выше её цена. Вкладывай в ремонт, чтобы получить прибыль!" },
  { title: "Продажа", text: "Продавай машины через Гараж. Зарабатываешь деньги и XP. Удачи в бизнесе! 🚀" }
];

// ===== СОСТОЯНИЕ =====
let currentUser = null;
let marketCars = [];
let tutorialStep = 0;

// ===== АВТОРИЗАЦИЯ =====
function getUsers() {
  return JSON.parse(localStorage.getItem('perekup_users') || '{}');
}

function saveUsers(users) {
  localStorage.setItem('perekup_users', JSON.stringify(users));
}

function doRegister() {
  const nick = document.getElementById('regNick').value.trim();
  const pass = document.getElementById('regPass').value.trim();
  const err = document.getElementById('regError');

  if (nick.length < 3 || nick.length > 16) return err.textContent = 'Ник: 3-16 символов';
  if (pass.length < 4) return err.textContent = 'Пароль: минимум 4 символа';

  const users = getUsers();
  if (users[nick.toLowerCase()]) return err.textContent = 'Ник уже занят';

  users[nick.toLowerCase()] = {
    nick, pass,
    balance: 10000,
    level: 1, xp: 0,
    garage: [],
    tutorialDone: false,
    created: Date.now()
  };
  saveUsers(users);
  err.textContent = '';
  toast('Аккаунт создан! Входи 👉');
  document.querySelector('.tab[data-tab="login"]').click();
}

function doLogin() {
  const nick = document.getElementById('loginNick').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const err = document.getElementById('loginError');

  const users = getUsers();
  const user = users[nick.toLowerCase()];

  if (!user) return err.textContent = 'Такого ника нет';
  if (user.pass !== pass) return err.textContent = 'Неверный пароль';

  currentUser = user;
  localStorage.setItem('perekup_current', nick.toLowerCase());
  err.textContent = '';
  enterGame();
}

function logout() {
  localStorage.removeItem('perekup_current');
  currentUser = null;
  document.getElementById('gameScreen').classList.remove('active');
  document.getElementById('authScreen').classList.add('active');
}

function saveCurrentUser() {
  const users = getUsers();
  users[currentUser.nick.toLowerCase()] = currentUser;
  saveUsers(users);
}

// ===== ИГРА =====
function enterGame() {
  document.getElementById('authScreen').classList.remove('active');
  document.getElementById('gameScreen').classList.add('active');
  updateUI();
  renderPage('garage');

  if (!currentUser.tutorialDone) {
    tutorialStep = 0;
    showTutorial();
  }
}

function updateUI() {
  document.getElementById('balance').textContent = formatMoney(currentUser.balance);
  document.getElementById('userNick').textContent = currentUser.nick;
  document.getElementById('level').textContent = currentUser.level;
  const xpMax = currentUser.level * 100;
  document.getElementById('xp').textContent = currentUser.xp;
  document.getElementById('xpMax').textContent = xpMax;
  document.getElementById('progressFill').style.width = (currentUser.xp / xpMax * 100) + '%';
}

function formatMoney(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function addXP(amount) {
  currentUser.xp += amount;
  const xpMax = currentUser.level * 100;
  if (currentUser.xp >= xpMax) {
    currentUser.xp -= xpMax;
    currentUser.level++;
    toast(`🎉 Уровень ${currentUser.level}!`);
  }
  saveCurrentUser();
  updateUI();
}

// ===== ГЕНЕРАЦИЯ МАШИН =====
function generateCar() {
  const template = CARS_DB[Math.floor(Math.random() * CARS_DB.length)];
  const year = 1990 + Math.floor(Math.random() * 34);
  const condition = Math.floor(20 + Math.random() * 80); // 20-100%

  const ageFactor = 1 - (2024 - year) / 50;
  const conditionFactor = condition / 100;
  const price = Math.round(
    template.basePrice * ageFactor * (0.4 + conditionFactor * 0.6) *
    (0.85 + Math.random() * 0.3) / 1000
  ) * 1000;

  return {
    id: 'car_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name: template.name,
    emoji: template.emoji,
    year,
    condition,
    price,
    reliability: template.reliability,
    bought: false
  };
}

function refreshMarket() {
  marketCars = [];
  for (let i = 0; i < 6; i++) marketCars.push(generateCar());
}

// ===== СТРАНИЦЫ =====
function renderPage(page) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  const main = document.getElementById('mainContent');

  if (page === 'garage') renderGarage(main);
  else if (page === 'market') renderMarket(main);
  else if (page === 'repair') renderRepair(main);
  else if (page === 'profile') renderProfile(main);
}

function renderGarage(el) {
  el.innerHTML = `<h2>🏠 Мой гараж (${currentUser.garage.length})</h2>`;
  if (currentUser.garage.length === 0) {
    el.innerHTML += `<div class="empty">Гараж пуст.<br>Купи первую машину на Рынке 🛒</div>`;
    return;
  }
  currentUser.garage.forEach(car => {
    const sellPrice = calcSellPrice(car);
    const profit = sellPrice - car.price;
    el.innerHTML += `
      <div class="car-card">
        <div class="car-header">
          <div>
            <div class="car-name">${car.name}</div>
            <div class="car-year">${car.year} г.</div>
          </div>
          <div class="car-emoji">${car.emoji}</div>
        </div>
        <div class="car-stats">
          <span>Состояние: ${car.condition}%</span>
          <span>Вложено: ${formatMoney(car.price)} ₽</span>
        </div>
        <div class="condition-bar">
          <div class="condition-fill" style="width:${car.condition}%;background:${condColor(car.condition)}"></div>
        </div>
        <div class="car-price">💰 Продажа: ${formatMoney(sellPrice)} ₽</div>
        <div style="font-size:13px;color:${profit >= 0 ? '#00b894' : '#ff4757'};margin-top:4px">
          ${profit >= 0 ? '📈 Прибыль' : '📉 Убыток'}: ${formatMoney(profit)} ₽
        </div>
        <div class="car-actions">
          <button class="btn-sell" onclick="sellCar('${car.id}')">Продать</button>
        </div>
      </div>`;
  });
}

function renderMarket(el) {
  if (marketCars.length === 0) refreshMarket();
  el.innerHTML = `<h2>🛒 Рынок</h2>
    <button class="btn-primary" style="margin-bottom:16px" onclick="refreshMarket();renderPage('market')">🔄 Обновить ленту (бесплатно)</button>`;

  marketCars.forEach(car => {
    const canBuy = currentUser.balance >= car.price;
    el.innerHTML += `
      <div class="car-card">
        <div class="car-header">
          <div>
            <div class="car-name">${car.name}</div>
            <div class="car-year">${car.year} г. • ${car.condition}% сост.</div>
          </div>
          <div class="car-emoji">${car.emoji}</div>
        </div>
        <div class="condition-bar">
          <div class="condition-fill" style="width:${car.condition}%;background:${condColor(car.condition)}"></div>
        </div>
        <div class="car-price">${formatMoney(car.price)} ₽</div>
        <div class="car-actions">
          <button class="${canBuy ? 'btn-buy' : 'btn-disabled'}" onclick="buyCar('${car.id}')">
            ${canBuy ? 'Купить' : 'Недостаточно денег'}
          </button>
        </div>
      </div>`;
  });
}

function renderRepair(el) {
  el.innerHTML = `<h2>🔧 Ремонт</h2>`;
  if (currentUser.garage.length === 0) {
    el.innerHTML += `<div class="empty">Нет машин для ремонта</div>`;
    return;
  }
  currentUser.garage.forEach(car => {
    const repairCost = calcRepairCost(car);
    const needRepair = car.condition < 100;
    el.innerHTML += `
      <div class="car-card">
        <div class="car-header">
          <div>
            <div class="car-name">${car.name}</div>
            <div class="car-year">${car.year} г.</div>
          </div>
          <div class="car-emoji">${car.emoji}</div>
        </div>
        <div class="car-stats"><span>Состояние: ${car.condition}%</span></div>
        <div class="condition-bar">
          <div class="condition-fill" style="width:${car.condition}%;background:${condColor(car.condition)}"></div>
        </div>
        ${needRepair ? `
          <div class="car-price">🔧 Ремонт: ${formatMoney(repairCost)} ₽</div>
          <div class="car-actions">
            <button class="${currentUser.balance >= repairCost ? 'btn-repair' : 'btn-disabled'}" onclick="repairCar('${car.id}')">
              ${currentUser.balance >= repairCost ? 'Отремонтировать (+20%)' : 'Мало денег'}
            </button>
          </div>
        ` : `<div class="car-price" style="color:#00b894">✅ В идеале!</div>`}
      </div>`;
  });
}

function renderProfile(el) {
  el.innerHTML = `
    <h2>👤 Профиль</h2>
    <div class="car-card">
      <div style="font-size:18px;margin-bottom:12px"><b>${currentUser.nick}</b></div>
      <div style="color:#aaa;line-height:1.8">
        💰 Баланс: ${formatMoney(currentUser.balance)} ₽<br>
        ⭐ Уровень: ${currentUser.level}<br>
        📊 XP: ${currentUser.xp}/${currentUser.level * 100}<br>
        🚗 Машин в гараже: ${currentUser.garage.length}<br>
        📅 Аккаунт создан: ${new Date(currentUser.created).toLocaleDateString('ru')}
      </div>
    </div>
    <div class="car-card">
      <div style="font-size:14px;color:#888;line-height:1.6">
        <b>Об игре:</b> Перекуп Авто — симулятор торговли машинами. Покупай дешевле, ремонтируй, продавай дороже.
      </div>
    </div>
  `;
}

// ===== ДЕЙСТВИЯ =====
function buyCar(id) {
  const car = marketCars.find(c => c.id === id);
  if (!car || currentUser.balance < car.price) return;
  currentUser.balance -= car.price;
  currentUser.garage.push({ ...car, boughtPrice: car.price, price: car.price });
  marketCars = marketCars.filter(c => c.id !== id);
  addXP(10);
  saveCurrentUser();
  updateUI();
  renderPage('market');
  toast(`✅ Куплено: ${car.name}`);
}

function sellCar(id) {
  const idx = currentUser.garage.findIndex(c => c.id === id);
  if (idx === -1) return;
  const car = currentUser.garage[idx];
  const price = calcSellPrice(car);
  const profit = price - car.price;
  currentUser.balance += price;
  currentUser.garage.splice(idx, 1);
  addXP(25);
  saveCurrentUser();
  updateUI();
  renderPage('garage');
  toast(`💸 Продано за ${formatMoney(price)} ₽ (${profit >= 0 ? '+' : ''}${formatMoney(profit)})`);
}

function repairCar(id) {
  const car = currentUser.garage.find(c => c.id === id);
  if (!car) return;
  const cost = calcRepairCost(car);
  if (currentUser.balance < cost) return;
  currentUser.balance -= cost;
  car.condition = Math.min(100, car.condition + 20);
  car.price += cost;
  saveCurrentUser();
  updateUI();
  renderPage('repair');
  toast(`🔧 Отремонтировано (+20%)`);
}

function calcSellPrice(car) {
  const base = car.boughtPrice || car.price;
  return Math.round(base * (0.5 + car.condition / 100 * 0.7));
}

function calcRepairCost(car) {
  return Math.round(car.price * 0.15);
}

function condColor(c) {
  if (c >= 70) return '#00b894';
  if (c >= 40) return '#fdcb6e';
  return '#ff4757';
}

// ===== ТУТОРИАЛ =====
function showTutorial() {
  const t = TUTORIAL_STEPS[tutorialStep];
  document.getElementById('tutTitle').textContent = t.title;
  document.getElementById('tutText').textContent = t.text;
  document.getElementById('tutorial').classList.remove('hidden');
}

function nextTutorial() {
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_STEPS.length) {
    document.getElementById('tutorial').classList.add('hidden');
    currentUser.tutorialDone = true;
    saveCurrentUser();
  } else {
    showTutorial();
  }
}

// ===== TOAST =====
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
    });
  });

  // Nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => renderPage(btn.dataset.page));
  });

  // Автовход
  const saved = localStorage.getItem('perekup_current');
  if (saved) {
    const users = getUsers();
    if (users[saved]) {
      currentUser = users[saved];
      enterGame();
    }
  }

  refreshMarket();
});
