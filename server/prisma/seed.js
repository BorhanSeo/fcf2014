const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 সিডিং শুরু হচ্ছে...\n');

  // Clear existing data
  await prisma.payment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.fixedAsset.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('282065', 12);
  const userPassword = await bcrypt.hash('password123', 12);

  // Create Super Admin
  const admin = await prisma.user.create({
    data: {
      name: 'আরিফ হোসেন',
      email: 'admin@fcfgroups.com',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      phone: '01700000000',
      monthlyAmount: 5000,
      joinDate: new Date('2020-10-01'),
    },
  });
  console.log(`✅ Admin: ${admin.name} (${admin.email})`);

  // Create 10 Users
  const members = [
    { name: 'রাকিব হাসান', email: 'rakib@sanchoy.app', phone: '01711111111' },
    { name: 'সাব্বির আহমেদ', email: 'sabbir@sanchoy.app', phone: '01722222222' },
    { name: 'তানভীর ইসলাম', email: 'tanvir@sanchoy.app', phone: '01733333333' },
    { name: 'নাঈম উদ্দীন', email: 'naeem@sanchoy.app', phone: '01744444444' },
    { name: 'ফাহিম রহমান', email: 'fahim@sanchoy.app', phone: '01755555555' },
    { name: 'মাহমুদ হক', email: 'mahmud@sanchoy.app', phone: '01766666666' },
    { name: 'জাহিদ করিম', email: 'zahid@sanchoy.app', phone: '01777777777' },
    { name: 'ইমরান খান', email: 'imran@sanchoy.app', phone: '01788888888' },
    { name: 'সোহেল রানা', email: 'sohel@sanchoy.app', phone: '01799999999' },
    { name: 'আশিক মাহমুদ', email: 'ashik@sanchoy.app', phone: '01710101010' },
  ];

  const users = [];
  for (const m of members) {
    const user = await prisma.user.create({
      data: { ...m, password: userPassword, monthlyAmount: 5000, joinDate: new Date('2020-10-01') },
    });
    users.push(user);
    console.log(`✅ User: ${user.name} (${user.email})`);
  }

  // Seed sample payments (Jan–Apr 2024 for all users)
  console.log('\n💰 পেমেন্ট সিড করা হচ্ছে...');
  for (const user of users) {
    for (let month = 1; month <= 4; month++) {
      await prisma.payment.create({
        data: {
          userId: user.id, year: 2024, month, amount: 5000,
          paidDate: new Date(2024, month - 1, 15), status: 'PAID',
        },
      });
    }
  }
  console.log('✅ ৪ মাসের পেমেন্ট সিড হয়েছে (সব সদস্য)');

  // Seed sample investment
  console.log('\n📈 বিনিয়োগ সিড করা হচ্ছে...');
  await prisma.investment.create({
    data: {
      title: 'মুদি দোকান বিনিয়োগ', amount: 100000, date: new Date('2024-02-01'),
      returnAmount: 15000, type: 'ব্যবসা', status: 'ACTIVE', note: 'মাসিক ভাড়া আয়',
    },
  });
  console.log('✅ ১টি বিনিয়োগ সিড হয়েছে');

  // Seed sample expense
  console.log('\n💸 খরচ সিড করা হচ্ছে...');
  await prisma.expense.create({
    data: {
      title: 'ব্যাংক চার্জ', amount: 500, date: new Date('2024-03-15'),
      category: 'Administrative', note: 'মাসিক চার্জ',
    },
  });
  console.log('✅ ১টি খরচ সিড হয়েছে');

  console.log('\n🎉 সিডিং সম্পন্ন!');
  console.log('\n📋 লগইন তথ্য:');
  console.log('   Admin: admin@fcfgroups.com / 282065');
  console.log('   User:  rakib@sanchoy.app / password123');
}

main()
  .catch((e) => { console.error('সিড এরর:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
