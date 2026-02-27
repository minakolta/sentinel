import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed Products
  const products = ["Platform A", "Platform B", "Platform C", "Custom Solution"];
  for (const name of products) {
    await prisma.product.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ Created ${products.length} products`);

  // Seed Environments
  const environments = [
    { name: "Development", order: 0 },
    { name: "SIT", order: 1 },
    { name: "UAT", order: 2 },
    { name: "Production", order: 3 },
    { name: "DR", order: 4 },
  ];
  for (const env of environments) {
    await prisma.environment.upsert({
      where: { name: env.name },
      update: { order: env.order },
      create: env,
    });
  }
  console.log(`✓ Created ${environments.length} environments`);

  // Seed Operating Systems
  const operatingSystems = ["Windows Server 2022", "Windows Server 2019", "Ubuntu 22.04 LTS", "RHEL 9", "CentOS 7"];
  for (const name of operatingSystems) {
    await prisma.operatingSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ Created ${operatingSystems.length} operating systems`);

  // Seed Component Types
  const componentTypes = [
    "Web Server",
    "Application Server",
    "Database Server",
    "API Gateway",
    "Load Balancer",
    "Message Queue",
    "Cache Server",
    "File Server",
  ];
  for (const name of componentTypes) {
    await prisma.componentType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ Created ${componentTypes.length} component types`);

  // Seed License Types
  const licenseTypes = [
    { name: "JWT Token", isJwt: true },
    { name: "License File", isJwt: false },
    { name: "API Key", isJwt: false },
    { name: "Certificate", isJwt: false },
    { name: "Subscription Key", isJwt: false },
  ];
  for (const lt of licenseTypes) {
    await prisma.licenseType.upsert({
      where: { name: lt.name },
      update: { isJwt: lt.isJwt },
      create: lt,
    });
  }
  console.log(`✓ Created ${licenseTypes.length} license types`);

  // Seed default settings
  const defaultSettings = [
    { key: "org.name", value: JSON.stringify("Sentinel") },
    { key: "org.allowedDomains", value: JSON.stringify([]) },
    { key: "alerts.windows", value: JSON.stringify([60, 30, 14, 7, 3, 1]) },
    { key: "smtp.enabled", value: JSON.stringify(false) },
    { key: "slack.enabled", value: JSON.stringify(false) },
  ];
  for (const setting of defaultSettings) {
    const exists = await prisma.setting.findUnique({ where: { key: setting.key } });
    if (!exists) {
      await prisma.setting.create({
        data: {
          key: setting.key,
          value: setting.value,
        },
      });
    }
  }
  console.log(`✓ Created default settings`);

  console.log("✅ Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
