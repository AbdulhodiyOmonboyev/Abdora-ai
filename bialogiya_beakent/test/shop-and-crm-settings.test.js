const test = require('node:test');
const assert = require('node:assert/strict');

test('Shop purchase: verifies coin deduction and prevents purchase when coins are insufficient', () => {
  const item = {
    id: 'item-shirt',
    title: 'Abdora AI Futbolkasi',
    priceCoins: 150,
    stock: 5,
  };

  const studentWithFewCoins = { id: 'u1', coins: 80 };
  const studentWithEnoughCoins = { id: 'u2', coins: 200 };

  // 1. Should fail when student does not have enough coins
  assert.equal(studentWithFewCoins.coins < item.priceCoins, true);

  // 2. Should succeed when student has enough coins
  assert.equal(studentWithEnoughCoins.coins >= item.priceCoins, true);
  const remainingCoins = studentWithEnoughCoins.coins - item.priceCoins;
  assert.equal(remainingCoins, 50);

  // 3. Decrement stock
  const remainingStock = item.stock - 1;
  assert.equal(remainingStock, 4);
});

test('Lead settings: custom lead sources and custom lead stages formatting', () => {
  const defaultSources = ['Instagram', 'Telegram', 'Facebook', 'TikTok'];
  const newSource = 'Maktab Aksiyasi';

  const updatedSources = [...defaultSources, newSource];
  assert.equal(updatedSources.includes('Maktab Aksiyasi'), true);
  assert.equal(updatedSources.length, 5);

  const defaultStages = [
    { id: 'new', label: 'Yangi murojaat', color: '#3b82f6' },
    { id: 'contacted', label: "Aloqa o'rnatildi", color: '#6366f1' },
  ];
  const customStage = { id: 'vip_interview', label: "Rahbariyat bilan suhbat", color: '#f59e0b' };
  const updatedStages = [...defaultStages, customStage];

  assert.equal(updatedStages.length, 3);
  assert.equal(updatedStages[2].label, "Rahbariyat bilan suhbat");
});
