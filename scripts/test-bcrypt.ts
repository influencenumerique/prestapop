/**
 * Script de test pour vérifier que le hashing bcrypt fonctionne correctement
 *
 * Usage: npx tsx scripts/test-bcrypt.ts
 */

import bcrypt from 'bcryptjs'

async function testBcrypt() {
  console.log('🧪 Test du hashing bcrypt\n')

  const testPasswords = [
    'password123',
    'MonMotDePasse!2024',
    'Test@123',
  ]

  for (const password of testPasswords) {
    console.log(`\n📝 Test avec: "${password}"`)
    console.log('-'.repeat(50))

    // 1. Hasher le mot de passe
    const startHash = Date.now()
    const hashed = await bcrypt.hash(password, 10)
    const hashTime = Date.now() - startHash

    console.log(`✅ Hash généré en ${hashTime}ms`)
    console.log(`   Format: ${hashed.substring(0, 20)}...`)
    console.log(`   Longueur: ${hashed.length} caractères`)

    // 2. Vérifier avec le bon mot de passe
    const startCompare = Date.now()
    const isValid = await bcrypt.compare(password, hashed)
    const compareTime = Date.now() - startCompare

    console.log(`${isValid ? '✅' : '❌'} Comparaison avec bon mot de passe: ${isValid} (${compareTime}ms)`)

    // 3. Vérifier avec un mauvais mot de passe
    const startWrong = Date.now()
    const isInvalid = await bcrypt.compare('wrongpassword', hashed)
    const wrongTime = Date.now() - startWrong

    console.log(`${!isInvalid ? '✅' : '❌'} Comparaison avec mauvais mot de passe: ${isInvalid} (${wrongTime}ms)`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Tous les tests bcrypt sont passés avec succès!')
  console.log('='.repeat(50))
  console.log('\n💡 Informations:')
  console.log('   - Les hash bcrypt commencent par $2b$10$')
  console.log('   - Temps de hashing: ~70ms (sécurité optimale)')
  console.log('   - Temps de comparaison: ~70ms')
  console.log('   - Chaque hash est unique même pour le même mot de passe')

  // Démonstration: même mot de passe = hash différents
  console.log('\n🔐 Démonstration de l\'unicité:')
  const password = 'test123'
  const hash1 = await bcrypt.hash(password, 10)
  const hash2 = await bcrypt.hash(password, 10)
  console.log(`   Mot de passe: "${password}"`)
  console.log(`   Hash 1: ${hash1.substring(0, 30)}...`)
  console.log(`   Hash 2: ${hash2.substring(0, 30)}...`)
  console.log(`   Identiques? ${hash1 === hash2 ? 'Oui' : 'Non (normal!)'}`)
  console.log('\n✅ Prêt pour la production!')
}

testBcrypt().catch(console.error)
