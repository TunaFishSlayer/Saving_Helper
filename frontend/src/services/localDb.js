import Dexie from 'dexie';

export const localDb = new Dexie('SavingsHelperLocalDB');

// Define the database tables and key indexes
// clientUuid is the primary key to allow offline item creation.
localDb.version(1).stores({
  categories: 'clientUuid, id, name, userId',
  transactions: 'clientUuid, id, amount, type, categoryId, date, userId, synced',
  budgets: 'clientUuid, id, limitAmount, period, categoryId, userId',
  goals: 'clientUuid, id, name, targetAmount, currentAmount, userId',
  syncQueue: '++id, action, entityType, clientUuid, timestamp'
});

localDb.version(2).stores({
  subscriptions: 'clientUuid, id, name, amount, billingCycle, nextBillingDate, userId'
});

// Version 3: flag table to track whether default categories have been seeded
localDb.version(3).stores({
  appMeta: 'key'
});

// ─── Default Category Seed Data ──────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  // ── Chi tiêu (Expense) ─────────────────────────────────────────────────────
  { name: 'Ăn uống',          type: 'expense', description: 'Nhà hàng, quán ăn, đồ ăn nhanh' },
  { name: 'Siêu thị',         type: 'expense', description: 'Mua sắm tại siêu thị, tạp hóa' },
  { name: 'Di chuyển',        type: 'expense', description: 'Grab, taxi, xăng xe, gửi xe' },
  { name: 'Hóa đơn & Tiện ích', type: 'expense', description: 'Điện, nước, internet, điện thoại' },
  { name: 'Mua sắm',          type: 'expense', description: 'Quần áo, giày dép, đồ dùng cá nhân' },
  { name: 'Sức khỏe',         type: 'expense', description: 'Thuốc, bệnh viện, phòng khám' },
  { name: 'Giải trí',         type: 'expense', description: 'Phim, karaoke, sự kiện, game' },
  { name: 'Giáo dục',         type: 'expense', description: 'Học phí, sách, khóa học' },
  { name: 'Nhà ở',            type: 'expense', description: 'Tiền thuê nhà, sửa chữa' },
  { name: 'Chi tiêu khác',    type: 'expense', description: 'Các chi tiêu chưa phân loại' },

  // ── Thu nhập (Income) ──────────────────────────────────────────────────────
  { name: 'Lương',            type: 'income',  description: 'Lương hàng tháng, thưởng' },
  { name: 'Làm thêm',         type: 'income',  description: 'Freelance, part-time, việc phụ' },
  { name: 'Đầu tư',           type: 'income',  description: 'Cổ phiếu, tiền gửi, tiền lãi' },
  { name: 'Kinh doanh',       type: 'income',  description: 'Thu nhập từ kinh doanh cá nhân' },
  { name: 'Thu nhập khác',    type: 'income',  description: 'Quà, tiền hỗ trợ, các khoản khác' },
];

// ─── Seed function (idempotent) ───────────────────────────────────────────────
export async function seedDefaultCategories() {
  try {
    // Check if we've already seeded
    const seeded = await localDb.appMeta.get('defaultCategoriesSeeded_v2');
    if (seeded) return;

    // Only seed if the category table is genuinely empty
    const existingCount = await localDb.categories.count();
    if (existingCount === 0) {
      const rows = DEFAULT_CATEGORIES.map(cat => {
        const id = generateUUID();
        return { ...cat, id, clientUuid: id, isDefault: true };
      });
      await localDb.categories.bulkPut(rows);
      console.log(`[DB] Seeded ${rows.length} default categories.`);
    }

    // Mark as seeded so we never run again
    await localDb.appMeta.put({ key: 'defaultCategoriesSeeded_v2', value: true });
  } catch (err) {
    console.error('[DB] Failed to seed default categories:', err);
  }
}

// Helper to generate v4 UUIDs client-side without external dependencies
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
