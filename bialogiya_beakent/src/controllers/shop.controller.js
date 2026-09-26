const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_SHOP_ITEMS = [
  {
    id: 'item-merch-shirt',
    title: 'Abdora AI Futbolkasi',
    description: "Markaz logotipi tushirilgan sifatli paxta futbolka (barcha o'lchamlar)",
    priceCoins: 150,
    category: 'merch',
    stock: 25,
    icon: 'Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-merch-stickers',
    title: "Stikerlar to'plami",
    description: "Noutbuk va daftarlar uchun mo'ljallangan qiziqarli stikerlar",
    priceCoins: 30,
    category: 'merch',
    stock: 100,
    icon: 'Sparkles',
    imageUrl: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-book-biology',
    title: 'Biologiya va Anatomiya Ensiklopediyasi',
    description: "Rangli illyustratsiyali zamonaviy qo'llanma va darslik",
    priceCoins: 120,
    category: 'book',
    stock: 15,
    icon: 'BookOpen',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-discount-10',
    title: "Oylik kurs to'loviga 10% chegirma",
    description: "Keyingi oy to'lovi uchun amal qiluvchi chegirma vaucheri",
    priceCoins: 200,
    category: 'discount',
    stock: null, // Cheksiz
    icon: 'Tag',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-stationery-set',
    title: 'Brendli ruchka va bloknot',
    description: "Qulay qaydlar uchun qattiq muqovali bloknot va metall ruchka",
    priceCoins: 60,
    category: 'merch',
    stock: 40,
    icon: 'Pencil',
    imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

async function resolveCenterForUser(user) {
  if (user.centerId) {
    const center = await prisma.center.findUnique({ where: { id: user.centerId } });
    if (center) return center;
  }
  // Fallback to first active center
  let center = await prisma.center.findFirst({ where: { isActive: true } });
  if (!center) {
    center = await prisma.center.create({
      data: { name: 'Abdora AI Markazi', settings: { shopItems: DEFAULT_SHOP_ITEMS, shopOrders: [] } }
    });
  }
  return center;
}

// GET /api/shop/items
const getShopItems = async (req, res, next) => {
  try {
    const center = await resolveCenterForUser(req.user);
    const settings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    let items = Array.isArray(settings.shopItems) ? settings.shopItems : null;

    if (!items || items.length === 0) {
      items = DEFAULT_SHOP_ITEMS;
      // Initialize in DB if empty
      await prisma.center.update({
        where: { id: center.id },
        data: { settings: { ...settings, shopItems: items, shopOrders: settings.shopOrders || [] } },
      });
    } else {
      // Sync default item imageUrls if missing in existing DB items
      let needUpdate = false;
      items = items.map(it => {
        const def = DEFAULT_SHOP_ITEMS.find(d => d.id === it.id);
        if (def && !it.imageUrl) {
          needUpdate = true;
          return { ...it, imageUrl: def.imageUrl };
        }
        return it;
      });

      if (needUpdate) {
        await prisma.center.update({
          where: { id: center.id },
          data: { settings: { ...settings, shopItems: items } },
        }).catch(() => {});
      }
    }

    // Students only see active items
    if (req.user.role === 'student') {
      items = items.filter(it => it.isActive !== false);
    }

    return success(res, items);
  } catch (err) { next(err); }
};

// POST /api/shop/items (Manager & Admin only)
const createShopItem = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return error(res, "Faqat menejer yoki admin mahsulot qo'sha oladi", 403);
    }

    const { title, description, priceCoins, category, stock, icon, imageUrl, isActive } = req.body;
    if (!title || !title.trim()) return error(res, "Mahsulot nomi kiritilishi shart", 400);
    const parsedPrice = parseInt(priceCoins, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return error(res, "Tanga narxi musbat son bo'lishi shart", 400);
    }

    const center = await resolveCenterForUser(req.user);
    const settings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    const items = Array.isArray(settings.shopItems) ? [...settings.shopItems] : [...DEFAULT_SHOP_ITEMS];

    const newItem = {
      id: uuidv4(),
      title: title.trim(),
      description: description?.trim() || '',
      priceCoins: parsedPrice,
      category: category || 'merch',
      stock: stock !== undefined && stock !== '' && stock !== null ? Math.max(0, parseInt(stock, 10)) : null,
      icon: icon || 'Gift',
      imageUrl: imageUrl?.trim() || '',
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    };

    items.unshift(newItem);

    await prisma.center.update({
      where: { id: center.id },
      data: { settings: { ...settings, shopItems: items } },
    });

    return success(res, newItem, "Mahsulot muvaffaqiyatli qo'shildi", 201);
  } catch (err) { next(err); }
};

// PUT /api/shop/items/:id (Manager & Admin only)
const updateShopItem = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return error(res, "Ruxsat etilmagan", 403);
    }

    const { id } = req.params;
    const { title, description, priceCoins, category, stock, icon, imageUrl, isActive } = req.body;

    const center = await resolveCenterForUser(req.user);
    const settings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    const items = Array.isArray(settings.shopItems) ? [...settings.shopItems] : [...DEFAULT_SHOP_ITEMS];

    const idx = items.findIndex(it => it.id === id);
    if (idx === -1) return error(res, "Mahsulot topilmadi", 404);

    const existing = items[idx];
    const updated = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      priceCoins: priceCoins !== undefined ? Math.max(1, parseInt(priceCoins, 10)) : existing.priceCoins,
      category: category !== undefined ? category : existing.category,
      stock: stock !== undefined ? (stock === null || stock === '' ? null : Math.max(0, parseInt(stock, 10))) : existing.stock,
      icon: icon !== undefined ? icon : existing.icon,
      imageUrl: imageUrl !== undefined ? imageUrl?.trim() : existing.imageUrl,
      isActive: isActive !== undefined ? !!isActive : existing.isActive,
      updatedAt: new Date().toISOString(),
    };

    items[idx] = updated;

    await prisma.center.update({
      where: { id: center.id },
      data: { settings: { ...settings, shopItems: items } },
    });

    return success(res, updated, "Mahsulot yangilandi");
  } catch (err) { next(err); }
};

// DELETE /api/shop/items/:id (Manager & Admin only)
const deleteShopItem = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return error(res, "Ruxsat etilmagan", 403);
    }

    const { id } = req.params;
    const center = await resolveCenterForUser(req.user);
    const settings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    const items = Array.isArray(settings.shopItems) ? [...settings.shopItems] : [...DEFAULT_SHOP_ITEMS];

    const filtered = items.filter(it => it.id !== id);
    if (filtered.length === items.length) {
      return error(res, "Mahsulot topilmadi", 404);
    }

    await prisma.center.update({
      where: { id: center.id },
      data: { settings: { ...settings, shopItems: filtered } },
    });

    return success(res, { id }, "Mahsulot o'chirildi");
  } catch (err) { next(err); }
};

// POST /api/shop/purchase (Student spends coins)
const purchaseShopItem = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    if (!itemId) return error(res, "Mahsulot tanlanmagan", 400);

    const center = await resolveCenterForUser(req.user);
    const settings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    const items = Array.isArray(settings.shopItems) ? [...settings.shopItems] : [...DEFAULT_SHOP_ITEMS];

    const item = items.find(it => it.id === itemId);
    if (!item) return error(res, "Mahsulot topilmadi", 404);
    if (item.isActive === false) return error(res, "Ushbu mahsulot hozirda sotuvda mavjud emas", 400);
    if (item.stock !== null && item.stock <= 0) {
      return error(res, "Ushbu mahsulot omborda tugagan", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return error(res, "Foydalanuvchi topilmadi", 404);

    const userCoins = user.coins || 0;
    if (userCoins < item.priceCoins) {
      return error(
        res,
        `Tangalar yetarli emas! Sizda ${userCoins} ta tanga bor, bu mahsulot uchun esa ${item.priceCoins} ta tanga kerak.`,
        400
      );
    }

    const newCoins = userCoins - item.priceCoins;

    // Deduct coins from user
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: newCoins },
    });

    // Decrement stock if finite
    if (item.stock !== null && item.stock > 0) {
      item.stock -= 1;
    }

    // Record order in center settings
    const orders = Array.isArray(settings.shopOrders) ? [...settings.shopOrders] : [];
    const newOrder = {
      id: uuidv4(),
      itemId: item.id,
      itemTitle: item.title,
      priceCoins: item.priceCoins,
      category: item.category,
      studentId: user.id,
      studentName: user.name,
      studentUsername: user.username,
      studentPhone: user.phone || '',
      status: 'pending', // pending | fulfilled | cancelled
      createdAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);

    await prisma.center.update({
      where: { id: center.id },
      data: { settings: { ...settings, shopItems: items, shopOrders: orders } },
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'achievement',
        title: "Xaridingiz qabul qilindi!",
        message: `Siz "${item.title}" mahsulotini ${item.priceCoins} tangaga sotib oldingiz. Markaz ma'muriyatidan sovriningizni qabul qilib oling!`,
      },
    }).catch(() => {});

    return success(res, {
      order: newOrder,
      newCoins,
      message: `Tabriklaymiz! "${item.title}" muvaffaqiyatli xarid qilindi.`,
    });
  } catch (err) { next(err); }
};

// GET /api/shop/orders
const getShopOrders = async (req, res, next) => {
  try {
    const center = await resolveCenterForUser(req.user);
    const settings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    let orders = Array.isArray(settings.shopOrders) ? settings.shopOrders : [];

    // Students only see their own orders
    if (req.user.role === 'student') {
      orders = orders.filter(o => o.studentId === req.user.userId);
    }

    return success(res, orders);
  } catch (err) { next(err); }
};

// PUT /api/shop/orders/:id/status (Manager & Admin only)
const updateOrderStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return error(res, "Ruxsat etilmagan", 403);
    }

    const { id } = req.params;
    const { status } = req.body; // 'fulfilled' | 'cancelled' | 'pending'
    if (!['fulfilled', 'cancelled', 'pending'].includes(status)) {
      return error(res, "Status noto'g'ri", 400);
    }

    const center = await resolveCenterForUser(req.user);
    const settings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    const orders = Array.isArray(settings.shopOrders) ? [...settings.shopOrders] : [];

    const orderIdx = orders.findIndex(o => o.id === id);
    if (orderIdx === -1) return error(res, "Buyurtma topilmadi", 404);

    const order = orders[orderIdx];
    const prevStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();

    // If cancelled and wasn't previously cancelled, refund coins to student
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      const student = await prisma.user.findUnique({ where: { id: order.studentId } });
      if (student) {
        await prisma.user.update({
          where: { id: student.id },
          data: { coins: (student.coins || 0) + order.priceCoins },
        });
        await prisma.notification.create({
          data: {
            userId: student.id,
            type: 'system',
            title: "Buyurtma bekor qilindi va tangalar qaytarildi",
            message: `"${order.itemTitle}" uchun sarflangan ${order.priceCoins} ta tanga hisobingizga qaytarildi.`,
          },
        }).catch(() => {});
      }
    }

    await prisma.center.update({
      where: { id: center.id },
      data: { settings: { ...settings, shopOrders: orders } },
    });

    return success(res, order, "Buyurtma holati yangilandi");
  } catch (err) { next(err); }
};

module.exports = {
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  purchaseShopItem,
  getShopOrders,
  updateOrderStatus,
};
