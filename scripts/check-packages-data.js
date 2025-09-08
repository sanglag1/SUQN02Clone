const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPackagesData() {
  try {
    console.log('🔍 Checking packages data...\n');

    // Check ServicePackage
    const servicePackages = await prisma.servicePackage.findMany();
    console.log(`📦 ServicePackages: ${servicePackages.length}`);
    if (servicePackages.length > 0) {
      console.log('Sample packages:');
      servicePackages.slice(0, 3).forEach(pkg => {
        console.log(`  - ${pkg.name}: ${pkg.price} VND (Active: ${pkg.isActive})`);
      });
    }

    // Check UserPackage
    const userPackages = await prisma.userPackage.findMany({
      include: {
        servicePackage: true,
        user: true
      }
    });
    console.log(`\n👥 UserPackages: ${userPackages.length}`);
    if (userPackages.length > 0) {
      console.log('Sample user packages:');
      userPackages.slice(0, 3).forEach(up => {
        console.log(`  - User: ${up.user.email}, Package: ${up.servicePackage.name}, Active: ${up.isActive}`);
      });
    }

    // Check Users with admin role
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: 'admin'
        }
      },
      include: {
        role: true
      }
    });
    console.log(`\n👑 Admin Users: ${adminUsers.length}`);
    if (adminUsers.length > 0) {
      console.log('Admin users:');
      adminUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role.name})`);
      });
    }

    // Check Roles
    const roles = await prisma.role.findMany();
    console.log(`\n🎭 Roles: ${roles.length}`);
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.displayName}`);
    });

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackagesData();
