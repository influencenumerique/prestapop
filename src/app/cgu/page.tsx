import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation - PrestaPop",
  description: "Conditions générales d'utilisation de la plateforme PrestaPop",
}

export default function CGUPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Conditions Générales d&apos;Utilisation</h1>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Objet</h2>
          <p className="text-muted-foreground">
            Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de définir les modalités et conditions d&apos;utilisation de la plateforme PrestaPop, ainsi que les droits et obligations des utilisateurs.
          </p>
          <p className="text-muted-foreground mt-2">
            PrestaPop est une plateforme de mise en relation entre entreprises ayant des besoins de livraison et chauffeurs-livreurs indépendants.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Définitions</h2>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li><strong>Plateforme</strong> : le site web PrestaPop accessible à l&apos;adresse prestapop.com</li>
            <li><strong>Utilisateur</strong> : toute personne inscrite sur la Plateforme</li>
            <li><strong>Entreprise</strong> : utilisateur professionnel publiant des missions de livraison</li>
            <li><strong>Chauffeur</strong> : utilisateur professionnel indépendant proposant ses services de livraison</li>
            <li><strong>Mission</strong> : offre de prestation de livraison publiée par une Entreprise</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Inscription</h2>
          <p className="text-muted-foreground">
            L&apos;utilisation de la Plateforme nécessite une inscription préalable. L&apos;utilisateur s&apos;engage à fournir des informations exactes et à jour, et à les maintenir actualisées.
          </p>
          <p className="text-muted-foreground mt-2">
            Les chauffeurs doivent justifier de leur statut d&apos;indépendant (auto-entrepreneur, SASU, etc.) et fournir les documents requis (SIRET, assurance, permis).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Fonctionnement de la Plateforme</h2>
          <h3 className="font-medium mb-2">Pour les Entreprises :</h3>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Publication de missions de livraison</li>
            <li>Consultation des profils de chauffeurs</li>
            <li>Sélection et validation des candidatures</li>
            <li>Évaluation des chauffeurs après mission</li>
          </ul>

          <h3 className="font-medium mb-2">Pour les Chauffeurs :</h3>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Consultation des missions disponibles</li>
            <li>Candidature aux missions</li>
            <li>Réalisation des prestations acceptées</li>
            <li>Réception des paiements</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Obligations des Utilisateurs</h2>
          <p className="text-muted-foreground mb-4">Tout utilisateur s&apos;engage à :</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Respecter les présentes CGU</li>
            <li>Fournir des informations exactes et à jour</li>
            <li>Ne pas utiliser la Plateforme à des fins illicites</li>
            <li>Respecter les autres utilisateurs</li>
            <li>Ne pas contourner le système de paiement de la Plateforme</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Responsabilités</h2>
          <p className="text-muted-foreground">
            PrestaPop agit en tant que simple intermédiaire technique de mise en relation. PrestaPop n&apos;est pas partie aux contrats conclus entre Entreprises et Chauffeurs.
          </p>
          <p className="text-muted-foreground mt-2">
            Les Chauffeurs exercent leur activité en tant que professionnels indépendants et sont seuls responsables de l&apos;exécution de leurs prestations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Tarification et Paiements</h2>
          <p className="text-muted-foreground">
            Les tarifs des missions sont fixés librement par les Entreprises. PrestaPop prélève une commission sur chaque transaction réalisée via la Plateforme.
          </p>
          <p className="text-muted-foreground mt-2">
            Les paiements sont sécurisés et gérés par notre prestataire de paiement Stripe. Les fonds sont versés aux Chauffeurs après validation de la mission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Évaluations</h2>
          <p className="text-muted-foreground">
            Après chaque mission, les Entreprises peuvent évaluer les Chauffeurs. Ces évaluations sont publiques et contribuent à la réputation des Chauffeurs sur la Plateforme.
          </p>
          <p className="text-muted-foreground mt-2">
            Les évaluations doivent être honnêtes et respectueuses. PrestaPop se réserve le droit de modérer ou supprimer les évaluations abusives.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            Tous les éléments de la Plateforme (textes, images, logos, etc.) sont protégés par le droit de la propriété intellectuelle et appartiennent à PrestaPop ou à ses partenaires.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Données personnelles</h2>
          <p className="text-muted-foreground">
            Le traitement des données personnelles est détaillé dans notre <a href="/confidentialite" className="text-primary hover:underline">Politique de confidentialité</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Suspension et résiliation</h2>
          <p className="text-muted-foreground">
            PrestaPop se réserve le droit de suspendre ou de résilier le compte d&apos;un utilisateur en cas de non-respect des présentes CGU, sans préavis ni indemnité.
          </p>
          <p className="text-muted-foreground mt-2">
            L&apos;utilisateur peut à tout moment supprimer son compte depuis son espace personnel.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Modifications des CGU</h2>
          <p className="text-muted-foreground">
            PrestaPop se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou notification sur la Plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">13. Droit applicable et litiges</h2>
          <p className="text-muted-foreground">
            Les présentes CGU sont soumises au droit français. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant toute action judiciaire. À défaut, les tribunaux français seront compétents.
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8 pt-8 border-t">
          Dernière mise à jour : Janvier 2026
        </p>
      </div>
    </div>
  )
}
