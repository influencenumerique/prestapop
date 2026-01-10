import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create demo company user
  const companyUser = await prisma.user.upsert({
    where: { email: 'entreprise@prestapop.com' },
    update: { password: 'test123' },
    create: {
      email: 'entreprise@prestapop.com',
      name: 'LogiExpress',
      role: 'COMPANY',
      password: 'test123',
    },
  })

  const company = await prisma.company.upsert({
    where: { userId: companyUser.id },
    update: {},
    create: {
      userId: companyUser.id,
      companyName: 'LogiExpress',
      siret: '12345678901234',
      phone: '0145678900',
      address: '15 Rue de la Logistique',
      city: 'Paris',
      description: 'Entreprise de transport et logistique urbaine depuis 2015. Nous assurons des livraisons rapides et fiables en Île-de-France.',
      isVerified: true,
    },
  })

  console.log('Created company:', company.companyName)

  // Create demo driver user
  const driverUser = await prisma.user.upsert({
    where: { email: 'chauffeur@prestapop.com' },
    update: { password: 'test123' },
    create: {
      email: 'chauffeur@prestapop.com',
      name: 'Marc Dupont',
      role: 'DRIVER',
      password: 'test123',
    },
  })

  const driver = await prisma.driverProfile.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      phone: '0612345678',
      bio: 'Chauffeur-livreur indépendant avec 3 ans d\'expérience. Ponctuel, soigneux et professionnel.',
      city: 'Paris',
      vehicleTypes: ['CAR', 'VAN'],
      licenseNumber: 'AB123456',
      isVerified: true,
      isAvailable: true,
      rating: 4.8,
      totalDeliveries: 156,
      totalReviews: 42,
    },
  })

  console.log('Created driver:', driverUser.name)

  // Create demo jobs - Missions de transport urbain
  const tomorrow6h = new Date()
  tomorrow6h.setDate(tomorrow6h.getDate() + 1)
  tomorrow6h.setHours(6, 0, 0, 0)

  const tomorrow18h = new Date()
  tomorrow18h.setDate(tomorrow18h.getDate() + 1)
  tomorrow18h.setHours(18, 0, 0, 0)

  const dayAfter7h = new Date()
  dayAfter7h.setDate(dayAfter7h.getDate() + 2)
  dayAfter7h.setHours(7, 0, 0, 0)

  const dayAfter13h = new Date()
  dayAfter13h.setDate(dayAfter13h.getDate() + 2)
  dayAfter13h.setHours(13, 0, 0, 0)

  const nextWeek5h = new Date()
  nextWeek5h.setDate(nextWeek5h.getDate() + 7)
  nextWeek5h.setHours(5, 30, 0, 0)

  const nextWeek19h = new Date()
  nextWeek19h.setDate(nextWeek19h.getDate() + 7)
  nextWeek19h.setHours(19, 0, 0, 0)

  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: 'demo-job-1' },
      update: {},
      create: {
        id: 'demo-job-1',
        companyId: company.id,
        title: 'Tournée livraison Est Parisien',
        description: 'Tournée de livraison depuis le dépôt de Pantin. 85 stops prévus, secteur Paris 11e/12e/20e.',
        typeMission: 'DAY',
        missionZoneType: 'URBAN',
        secteurLivraison: 'Paris 11e, 12e, 20e',
        packageSize: 'MIXED',
        nombreColis: 120,
        startTime: tomorrow6h,
        estimatedEndTime: tomorrow18h,
        vehicleVolume: 'CUBE_12M',
        needsTailLift: false,
        dayRate: 16000, // 160€
        status: 'OPEN',
      },
    }),
    prisma.job.upsert({
      where: { id: 'demo-job-2' },
      update: {},
      create: {
        id: 'demo-job-2',
        companyId: company.id,
        title: 'Demi-journée 92 Sud',
        description: 'Livraison matin depuis le hub de Gennevilliers. Colis légers uniquement. Environ 45 points de livraison.',
        typeMission: 'HALF_DAY',
        missionZoneType: 'URBAN',
        secteurLivraison: 'Boulogne, Issy, Vanves, Malakoff',
        packageSize: 'SMALL',
        nombreColis: 65,
        startTime: dayAfter7h,
        estimatedEndTime: dayAfter13h,
        vehicleVolume: 'CUBE_6M',
        needsTailLift: false,
        dayRate: 8500, // 85€
        status: 'OPEN',
      },
    }),
    prisma.job.upsert({
      where: { id: 'demo-job-3' },
      update: {},
      create: {
        id: 'demo-job-3',
        companyId: company.id,
        title: 'Navette Paris → Lyon',
        description: 'Transport inter-urbain. Chargement au hub de Bercy, déchargement au dépôt Lyon Part-Dieu. Retour à vide possible.',
        typeMission: 'DAY',
        missionZoneType: 'CITY_TO_CITY',
        secteurLivraison: 'Paris → Lyon',
        packageSize: 'MIXED',
        nombreColis: 250,
        startTime: nextWeek5h,
        estimatedEndTime: nextWeek19h,
        vehicleVolume: 'CUBE_20M',
        needsTailLift: true,
        dayRate: 35000, // 350€
        status: 'OPEN',
      },
    }),
  ])

  console.log('Created demo jobs:', jobs.length)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
