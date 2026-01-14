import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@prestapop.com' },
    update: { password: 'test123', role: 'ADMIN' },
    create: {
      email: 'admin@prestapop.com',
      name: 'Super Admin',
      role: 'ADMIN',
      password: 'test123',
    },
  })

  console.log('Created admin:', adminUser.email)

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

  // ============ USERS PENDING_VERIF (inscriptions manuelles incomplètes) ============

  // Entreprise en attente de vérification (documents incomplets)
  const pendingCompanyUser = await prisma.user.upsert({
    where: { email: 'entreprise.pending@prestapop.com' },
    update: { status: 'PENDING_VERIF' },
    create: {
      email: 'entreprise.pending@prestapop.com',
      name: 'TransExpress SARL',
      role: 'COMPANY',
      status: 'PENDING_VERIF',
      password: 'test123',
      verificationDocs: {
        siretUrl: 'https://storage.prestapop.com/docs/transexpress-siret.pdf',
        permisUrl: null,
        assuranceUrl: null,
      },
    },
  })

  await prisma.company.upsert({
    where: { userId: pendingCompanyUser.id },
    update: {},
    create: {
      userId: pendingCompanyUser.id,
      companyName: 'TransExpress SARL',
      siret: '98765432109876',
      phone: '0156789012',
      city: 'Lyon',
      isVerified: false,
    },
  })

  // Documents de l'entreprise en attente
  await prisma.document.upsert({
    where: { userId_type: { userId: pendingCompanyUser.id, type: 'KBIS' } },
    update: {},
    create: {
      userId: pendingCompanyUser.id,
      type: 'KBIS',
      url: 'https://storage.prestapop.com/docs/transexpress-kbis.pdf',
      status: 'OK',
    },
  })

  await prisma.document.upsert({
    where: { userId_type: { userId: pendingCompanyUser.id, type: 'VEHICLE_INSURANCE' } },
    update: {},
    create: {
      userId: pendingCompanyUser.id,
      type: 'VEHICLE_INSURANCE',
      url: '',
      status: 'MISSING',
    },
  })

  // VerificationDoc pour Company - 1 document manquant (PENDING)
  await prisma.verificationDoc.upsert({
    where: { userId_documentType: { userId: pendingCompanyUser.id, documentType: 'KBIS_3MONTHS' } },
    update: {},
    create: {
      userId: pendingCompanyUser.id,
      documentType: 'KBIS_3MONTHS',
      cloudinaryUrl: 'https://res.cloudinary.com/prestapop/docs/transexpress-kbis.pdf',
      status: 'PENDING',
      adminNotes: null,
    },
  })

  console.log('Created pending company:', pendingCompanyUser.email)

  // Chauffeur en attente de vérification (permis illisible)
  const pendingDriverUser = await prisma.user.upsert({
    where: { email: 'chauffeur.pending@prestapop.com' },
    update: { status: 'PENDING_VERIF' },
    create: {
      email: 'chauffeur.pending@prestapop.com',
      name: 'Sophie Martin',
      role: 'DRIVER',
      status: 'PENDING_VERIF',
      password: 'test123',
      verificationDocs: {
        siretUrl: null,
        permisUrl: 'https://storage.prestapop.com/docs/sophie-permis.jpg',
        assuranceUrl: 'https://storage.prestapop.com/docs/sophie-assurance.pdf',
      },
    },
  })

  await prisma.driverProfile.upsert({
    where: { userId: pendingDriverUser.id },
    update: {},
    create: {
      userId: pendingDriverUser.id,
      phone: '0698765432',
      bio: 'Livreuse indépendante, disponible sur Lyon et environs.',
      city: 'Lyon',
      vehicleTypes: ['VAN'],
      isVerified: false,
      isAvailable: false,
    },
  })

  // Documents du chauffeur en attente
  await prisma.document.upsert({
    where: { userId_type: { userId: pendingDriverUser.id, type: 'DRIVER_LICENSE' } },
    update: {},
    create: {
      userId: pendingDriverUser.id,
      type: 'DRIVER_LICENSE',
      url: 'https://storage.prestapop.com/docs/sophie-permis.jpg',
      status: 'ILLEGIBLE',
    },
  })

  await prisma.document.upsert({
    where: { userId_type: { userId: pendingDriverUser.id, type: 'VEHICLE_INSURANCE' } },
    update: {},
    create: {
      userId: pendingDriverUser.id,
      type: 'VEHICLE_INSURANCE',
      url: 'https://storage.prestapop.com/docs/sophie-assurance.pdf',
      status: 'OK',
    },
  })

  // VerificationDoc pour Driver - 2 documents
  await prisma.verificationDoc.upsert({
    where: { userId_documentType: { userId: pendingDriverUser.id, documentType: 'IDENTITY' } },
    update: {},
    create: {
      userId: pendingDriverUser.id,
      documentType: 'IDENTITY',
      cloudinaryUrl: 'https://res.cloudinary.com/prestapop/docs/sophie-identity.jpg',
      status: 'APPROVED',
      adminNotes: 'Document vérifié',
    },
  })

  await prisma.verificationDoc.upsert({
    where: { userId_documentType: { userId: pendingDriverUser.id, documentType: 'DRIVER_LICENSE' } },
    update: {},
    create: {
      userId: pendingDriverUser.id,
      documentType: 'DRIVER_LICENSE',
      cloudinaryUrl: 'https://res.cloudinary.com/prestapop/docs/sophie-permis.jpg',
      status: 'REJECTED',
      adminNotes: 'Photo illisible, merci de renvoyer une photo plus nette',
    },
  })

  console.log('Created pending driver:', pendingDriverUser.email)

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

  // ============ MESSAGERIE TEST ============

  // Conversation 1: Admin <-> Chauffeur vérifié
  const conversation1 = await prisma.conversation.upsert({
    where: { id: 'conv-admin-driver-1' },
    update: { lastMessage: new Date() },
    create: {
      id: 'conv-admin-driver-1',
      lastMessage: new Date(),
    },
  })

  // Participants conversation 1
  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: conversation1.id, userId: adminUser.id } },
    update: {},
    create: {
      conversationId: conversation1.id,
      userId: adminUser.id,
    },
  })

  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: conversation1.id, userId: driverUser.id } },
    update: {},
    create: {
      conversationId: conversation1.id,
      userId: driverUser.id,
    },
  })

  // Messages conversation 1
  await prisma.message.upsert({
    where: { id: 'msg-1-1' },
    update: {},
    create: {
      id: 'msg-1-1',
      conversationId: conversation1.id,
      senderId: adminUser.id,
      receiverId: driverUser.id,
      content: 'Bonjour Marc, bienvenue sur PrestaPop ! Votre compte a été validé.',
      readAt: new Date(),
      createdAt: new Date(Date.now() - 86400000), // 1 jour avant
    },
  })

  await prisma.message.upsert({
    where: { id: 'msg-1-2' },
    update: {},
    create: {
      id: 'msg-1-2',
      conversationId: conversation1.id,
      senderId: driverUser.id,
      receiverId: adminUser.id,
      content: 'Merci beaucoup ! Je suis prêt à commencer les missions.',
      readAt: new Date(),
      createdAt: new Date(Date.now() - 82800000), // 23h avant
    },
  })

  console.log('Created conversation 1: Admin <-> Driver')

  // Conversation 2: Admin <-> Chauffeur en attente
  const conversation2 = await prisma.conversation.upsert({
    where: { id: 'conv-admin-driver-2' },
    update: { lastMessage: new Date() },
    create: {
      id: 'conv-admin-driver-2',
      lastMessage: new Date(),
    },
  })

  // Participants conversation 2
  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: conversation2.id, userId: adminUser.id } },
    update: {},
    create: {
      conversationId: conversation2.id,
      userId: adminUser.id,
    },
  })

  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: conversation2.id, userId: pendingDriverUser.id } },
    update: {},
    create: {
      conversationId: conversation2.id,
      userId: pendingDriverUser.id,
    },
  })

  // Messages conversation 2
  await prisma.message.upsert({
    where: { id: 'msg-2-1' },
    update: {},
    create: {
      id: 'msg-2-1',
      conversationId: conversation2.id,
      senderId: adminUser.id,
      receiverId: pendingDriverUser.id,
      content: 'Bonjour Sophie, votre permis de conduire est illisible. Merci de renvoyer une photo plus nette.',
      readAt: null, // Non lu
      createdAt: new Date(Date.now() - 3600000), // 1h avant
    },
  })

  console.log('Created conversation 2: Admin <-> Pending Driver')

  // ============ PLANS D'ABONNEMENT ============

  // Plans Chauffeurs
  await prisma.subscriptionPlan.upsert({
    where: { slug: 'driver-pro' },
    update: {},
    create: {
      name: 'Driver Pro',
      slug: 'driver-pro',
      description: 'Pour les chauffeurs actifs',
      tier: 'PRO',
      targetRole: 'DRIVER',
      priceMonthly: 990, // 9,90€
      priceYearly: 9900, // 99€ (2 mois offerts)
      maxApplicationsPerMonth: null, // Illimité
      commissionRate: 0.10, // 10%
      features: {
        badge: true,
        priority: true,
        alerts: true,
      },
      isPopular: true,
      sortOrder: 1,
      isActive: true,
    },
  })

  await prisma.subscriptionPlan.upsert({
    where: { slug: 'driver-business' },
    update: {},
    create: {
      name: 'Driver Business',
      slug: 'driver-business',
      description: 'Pour les pros de la livraison',
      tier: 'BUSINESS',
      targetRole: 'DRIVER',
      priceMonthly: 1490, // 14,90€
      priceYearly: 14900, // 149€
      maxApplicationsPerMonth: null, // Illimité
      commissionRate: 0.07, // 7%
      features: {
        badge: true,
        priority: true,
        alerts: true,
        analytics: true,
        support: 'priority',
      },
      isPopular: false,
      sortOrder: 2,
      isActive: true,
    },
  })

  // Plans Entreprises
  await prisma.subscriptionPlan.upsert({
    where: { slug: 'company-pro' },
    update: {},
    create: {
      name: 'Company Pro',
      slug: 'company-pro',
      description: 'Pour les PME actives',
      tier: 'PRO',
      targetRole: 'COMPANY',
      priceMonthly: 1990, // 19,90€
      priceYearly: 19900, // 199€
      maxMissionsPerMonth: 10,
      commissionRate: 0.12, // 12%
      features: {
        analytics: true,
        multiUsers: 3,
      },
      isPopular: true,
      sortOrder: 1,
      isActive: true,
    },
  })

  await prisma.subscriptionPlan.upsert({
    where: { slug: 'company-enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      slug: 'company-enterprise',
      description: 'Pour les grandes entreprises',
      tier: 'ENTERPRISE',
      targetRole: 'COMPANY',
      priceMonthly: 2990, // 29,90€
      priceYearly: 29900, // 299€
      maxMissionsPerMonth: null, // Illimité
      commissionRate: 0.08, // 8%
      features: {
        analytics: true,
        multiUsers: -1, // Illimité
        support: 'dedicated',
        api: true,
      },
      isPopular: false,
      sortOrder: 2,
      isActive: true,
    },
  })

  console.log('Created subscription plans')

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
