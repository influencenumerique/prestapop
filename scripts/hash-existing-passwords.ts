/**
 * Script de migration pour hasher les mots de passe existants en base de données
 *
 * ATTENTION: Ce script doit être exécuté UNE SEULE FOIS avant le déploiement en production
 *
 * Usage: npx tsx scripts/hash-existing-passwords.ts
 */

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function hashExistingPasswords() {
  console.log('🔐 Début de la migration des mots de passe...\n')

  try {
    // Récupérer tous les utilisateurs avec un mot de passe non null
    const users = await db.user.findMany({
      where: {
        password: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        password: true,
      }
    })

    console.log(`📊 ${users.length} utilisateur(s) trouvé(s) avec un mot de passe\n`)

    if (users.length === 0) {
      console.log('✅ Aucun utilisateur à migrer')
      return
    }

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        // Vérifier si le mot de passe est déjà hashé (commence par $2a$ ou $2b$)
        if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
          console.log(`⏭️  ${user.email} - Mot de passe déjà hashé, ignoré`)
          skippedCount++
          continue
        }

        // Hasher le mot de passe en clair
        const hashedPassword = await bcrypt.hash(user.password!, 10)

        // Mettre à jour l'utilisateur
        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })

        console.log(`✅ ${user.email} - Mot de passe hashé avec succès`)
        migratedCount++

      } catch (error) {
        console.error(`❌ ${user.email} - Erreur:`, error)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 RÉSULTAT DE LA MIGRATION:')
    console.log('='.repeat(50))
    console.log(`✅ Migrés:  ${migratedCount}`)
    console.log(`⏭️  Ignorés:  ${skippedCount}`)
    console.log(`❌ Erreurs:  ${errorCount}`)
    console.log(`📊 Total:    ${users.length}`)
    console.log('='.repeat(50))

    if (migratedCount > 0) {
      console.log('\n⚠️  IMPORTANT: Testez la connexion avec vos utilisateurs avant de déployer!')
    }

  } catch (error) {
    console.error('❌ Erreur fatale lors de la migration:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

// Exécution du script
hashExistingPasswords()
  .then(() => {
    console.log('\n✅ Migration terminée avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Échec de la migration:', error)
    process.exit(1)
  })
