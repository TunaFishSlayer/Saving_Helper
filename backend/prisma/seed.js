import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing database records
  await prisma.transaction.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create default test user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: passwordHash,
      provider: 'local'
    }
  });

  console.log(`Created test user: ${user.email}`);

  // 3. Create default categories
  const categoriesData = [
    { name: "Food & Dining", type: "expense", description: "Restaurants, cafes, groceries" },
    { name: "Housing", type: "expense", description: "Rent, bills, home utilities" },
    { name: "Transportation", type: "expense", description: "Gas, public transit, grab" },
    { name: "Entertainment", type: "expense", description: "Movies, games, subscriptions" },
    { name: "Shopping", type: "expense", description: "Clothing, personal purchases" },
    { name: "Salary", type: "income", description: "Monthly employment income" },
    { name: "Freelance", type: "income", description: "Side gigs and custom work" }
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: {
        ...cat,
        userId: user.id
      }
    });
    categories[cat.name] = createdCat.id;
  }

  console.log('Created financial categories.');

  // 4. Create mock subscriptions
  const subscriptionsData = [
    { name: "Netflix Premium", amount: 260000, billingCycle: "monthly", nextBillingDate: new Date('2026-06-15'), categoryId: categories["Entertainment"] },
    { name: "Gym Membership", amount: 500000, billingCycle: "monthly", nextBillingDate: new Date('2026-06-01'), categoryId: categories["Entertainment"] },
    { name: "Amazon Prime", amount: 3200000, billingCycle: "yearly", nextBillingDate: new Date('2026-11-20'), categoryId: categories["Entertainment"] }
  ];

  for (const sub of subscriptionsData) {
    await prisma.subscription.create({
      data: {
        ...sub,
        userId: user.id
      }
    });
  }

  console.log('Seeded active subscriptions.');

  // 5. Create mock goals
  const goalsData = [
    { name: "Emergency Fund", targetAmount: 50000000, currentAmount: 25000000, deadline: new Date('2027-01-01') },
    { name: "Vacation Trip", targetAmount: 15000000, currentAmount: 3000000, deadline: new Date('2026-08-01') }
  ];

  for (const goal of goalsData) {
    await prisma.goal.create({
      data: {
        ...goal,
        userId: user.id
      }
    });
  }

  console.log('Seeded savings goals.');

  // 6. Create mock budgets
  const budgetsData = [
    { amount: 5000000, period: "monthly", startDate: new Date('2026-05-01'), categoryId: categories["Food & Dining"] },
    { amount: 1500000, period: "monthly", startDate: new Date('2026-05-01'), categoryId: categories["Transportation"] }
  ];

  for (const budget of budgetsData) {
    await prisma.budget.create({
      data: {
        ...budget,
        userId: user.id
      }
    });
  }

  console.log('Seeded active monthly budgets.');

  // 7. Create mock transactions
  const transactionsData = [
    { amount: 30000000, description: "Monthly Salary", type: "income", date: new Date('2026-05-05'), categoryId: categories["Salary"] },
    { amount: 4500000, description: "Freelance UI work", type: "income", date: new Date('2026-05-18'), categoryId: categories["Freelance"] },
    { amount: 1200000, description: "Weekly Grocery Shopping", type: "expense", date: new Date('2026-05-10'), categoryId: categories["Food & Dining"] },
    { amount: 350000, description: "Sushi Restaurant dinner", type: "expense", date: new Date('2026-05-12'), categoryId: categories["Food & Dining"] },
    { amount: 200000, description: "Grab ride", type: "expense", date: new Date('2026-05-14'), categoryId: categories["Transportation"] },
    { amount: 90000, description: "Starbucks Coffee", type: "expense", date: new Date('2026-05-15'), categoryId: categories["Food & Dining"] },
    { amount: 3500000, description: "Apartment Rent Contribution", type: "expense", date: new Date('2026-05-01'), categoryId: categories["Housing"] }
  ];

  for (const tx of transactionsData) {
    await prisma.transaction.create({
      data: {
        ...tx,
        userId: user.id
      }
    });
  }

  console.log('Seeded standard transaction histories.');
  console.log('Database seeding successfully completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
