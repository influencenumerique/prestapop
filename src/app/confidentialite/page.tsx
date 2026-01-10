import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité - PrestaPop",
  description: "Politique de confidentialité et protection des données personnelles de PrestaPop",
}

export default function ConfidentialitePage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Politique de confidentialité</h1>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground">
            PrestaPop SAS (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) s&apos;engage à protéger la vie privée des utilisateurs de sa plateforme. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Responsable du traitement</h2>
          <p className="text-muted-foreground">
            <strong>PrestaPop SAS</strong><br />
            [Adresse du siège social]<br />
            Email DPO : dpo@prestapop.com
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Données collectées</h2>
          <p className="text-muted-foreground mb-4">Nous collectons les catégories de données suivantes :</p>

          <h3 className="font-medium mb-2">Données d&apos;identification :</h3>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Nom, prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Adresse postale</li>
          </ul>

          <h3 className="font-medium mb-2">Données professionnelles (chauffeurs) :</h3>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Numéro SIRET</li>
            <li>Permis de conduire</li>
            <li>Assurance professionnelle</li>
            <li>Type de véhicule</li>
          </ul>

          <h3 className="font-medium mb-2">Données d&apos;entreprise :</h3>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Raison sociale</li>
            <li>Numéro SIRET</li>
            <li>Adresse du siège</li>
          </ul>

          <h3 className="font-medium mb-2">Données de connexion :</h3>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Adresse IP</li>
            <li>Données de navigation</li>
            <li>Cookies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Finalités du traitement</h2>
          <p className="text-muted-foreground mb-4">Vos données sont traitées pour les finalités suivantes :</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Création et gestion de votre compte utilisateur</li>
            <li>Mise en relation entre entreprises et chauffeurs-livreurs</li>
            <li>Gestion des missions et des paiements</li>
            <li>Communication relative à nos services</li>
            <li>Amélioration de nos services</li>
            <li>Respect de nos obligations légales</li>
            <li>Prévention de la fraude</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Base légale du traitement</h2>
          <p className="text-muted-foreground">Le traitement de vos données repose sur :</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li><strong>L&apos;exécution du contrat</strong> : pour la fourniture de nos services</li>
            <li><strong>Le consentement</strong> : pour les communications marketing</li>
            <li><strong>L&apos;intérêt légitime</strong> : pour l&apos;amélioration de nos services</li>
            <li><strong>L&apos;obligation légale</strong> : pour le respect de nos obligations fiscales et comptables</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Durée de conservation</h2>
          <p className="text-muted-foreground">
            Vos données personnelles sont conservées pendant la durée de votre inscription sur notre plateforme, puis pendant une durée de 3 ans après votre dernière activité. Les données nécessaires au respect de nos obligations légales sont conservées pendant les durées légales applicables.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Destinataires des données</h2>
          <p className="text-muted-foreground mb-4">Vos données peuvent être partagées avec :</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Les autres utilisateurs de la plateforme (dans le cadre des missions)</li>
            <li>Nos prestataires techniques (hébergement, paiement)</li>
            <li>Les autorités compétentes (sur demande légale)</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Nous ne vendons jamais vos données personnelles à des tiers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Transferts hors UE</h2>
          <p className="text-muted-foreground">
            Vos données sont principalement traitées au sein de l&apos;Union Européenne. Si un transfert vers un pays tiers est nécessaire, nous nous assurons qu&apos;il bénéficie de garanties appropriées conformément au RGPD.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Vos droits</h2>
          <p className="text-muted-foreground mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
            <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données</li>
            <li><strong>Droit à la limitation</strong> : limiter le traitement de vos données</li>
            <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré</li>
            <li><strong>Droit d&apos;opposition</strong> : vous opposer au traitement de vos données</li>
            <li><strong>Droit de retirer votre consentement</strong> à tout moment</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:dpo@prestapop.com" className="text-primary hover:underline">dpo@prestapop.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Cookies</h2>
          <p className="text-muted-foreground mb-4">Notre site utilise les types de cookies suivants :</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement du site</li>
            <li><strong>Cookies analytiques</strong> : pour analyser l&apos;utilisation du site</li>
            <li><strong>Cookies de préférences</strong> : pour mémoriser vos choix</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Vous pouvez gérer vos préférences de cookies à tout moment via le bandeau de consentement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Sécurité</h2>
          <p className="text-muted-foreground">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction. Ces mesures incluent le chiffrement des données, des pare-feu, et des contrôles d&apos;accès stricts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Réclamation</h2>
          <p className="text-muted-foreground">
            Si vous estimez que le traitement de vos données n&apos;est pas conforme à la réglementation, vous pouvez introduire une réclamation auprès de la CNIL :<br />
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">13. Modifications</h2>
          <p className="text-muted-foreground">
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications entrent en vigueur dès leur publication sur cette page. Nous vous encourageons à consulter régulièrement cette page.
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8 pt-8 border-t">
          Dernière mise à jour : Janvier 2026
        </p>
      </div>
    </div>
  )
}
