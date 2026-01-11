import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions Générales de Vente - PrestaPop",
  description: "Conditions générales de vente des services PrestaPop",
}

export default function CGVPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Conditions Générales de Vente</h1>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Objet</h2>
          <p className="text-muted-foreground">
            Les présentes Conditions Générales de Vente (CGV) définissent les conditions tarifaires et commerciales applicables aux services proposés par PrestaPop, plateforme de mise en relation entre entreprises donneuses d&apos;ordre et chauffeurs-livreurs indépendants.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Services proposés</h2>
          <p className="text-muted-foreground mb-4">PrestaPop propose les services suivants :</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li><strong>Pour les entreprises :</strong> Publication de missions de livraison, accès aux profils de chauffeurs vérifiés, système de mise en relation et gestion des paiements sécurisés</li>
            <li><strong>Pour les chauffeurs :</strong> Accès aux offres de missions, candidature en ligne, système de notation et paiement garanti</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Tarification</h2>

          <h3 className="font-medium mb-2 mt-4">3.1 Pour les Entreprises</h3>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Inscription gratuite sur la plateforme</li>
            <li>Publication de missions gratuite</li>
            <li>Commission de service : <strong>10%</strong> du montant de la mission (prélevée sur le paiement)</li>
            <li>Frais de paiement sécurisé inclus dans la commission</li>
          </ul>

          <h3 className="font-medium mb-2">3.2 Pour les Chauffeurs</h3>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Inscription gratuite sur la plateforme</li>
            <li>Accès aux missions gratuit</li>
            <li>Commission de service : <strong>15%</strong> du montant de la mission (prélevée sur le paiement reçu)</li>
            <li>Virement sur compte bancaire sous 48-72h après validation de la mission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Tarifs indicatifs des missions</h2>
          <p className="text-muted-foreground mb-4">Les tarifs sont librement fixés par les entreprises. À titre indicatif :</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-muted">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-muted p-3 text-left">Type de mission</th>
                  <th className="border border-muted p-3 text-left">Fourchette tarifaire</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr>
                  <td className="border border-muted p-3">Demi-journée urbaine (6m³)</td>
                  <td className="border border-muted p-3">80€ - 120€</td>
                </tr>
                <tr>
                  <td className="border border-muted p-3">Journée urbaine (6m³)</td>
                  <td className="border border-muted p-3">140€ - 180€</td>
                </tr>
                <tr>
                  <td className="border border-muted p-3">Journée urbaine (12m³)</td>
                  <td className="border border-muted p-3">160€ - 220€</td>
                </tr>
                <tr>
                  <td className="border border-muted p-3">Journée inter-urbaine</td>
                  <td className="border border-muted p-3">180€ - 280€</td>
                </tr>
                <tr>
                  <td className="border border-muted p-3">Semaine complète</td>
                  <td className="border border-muted p-3">700€ - 1200€</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            *Ces tarifs sont donnés à titre indicatif et peuvent varier selon la région, la période et la complexité de la mission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Modalités de paiement</h2>

          <h3 className="font-medium mb-2">5.1 Paiement par l&apos;Entreprise</h3>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Paiement sécurisé par carte bancaire via Stripe</li>
            <li>Paiement à la validation de la candidature du chauffeur</li>
            <li>Montant séquestré jusqu&apos;à la validation de la mission</li>
          </ul>

          <h3 className="font-medium mb-2">5.2 Versement au Chauffeur</h3>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Versement déclenché après validation de la mission par l&apos;entreprise</li>
            <li>Délai de versement : 48 à 72 heures ouvrées</li>
            <li>Virement sur le compte bancaire déclaré</li>
            <li>Commission PrestaPop déduite automatiquement</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Facturation</h2>
          <p className="text-muted-foreground">
            PrestaPop émet une facture mensuelle récapitulative des commissions prélevées. Cette facture est disponible dans l&apos;espace personnel de chaque utilisateur et envoyée par email.
          </p>
          <p className="text-muted-foreground mt-2">
            Les chauffeurs indépendants sont responsables de leur propre facturation envers les entreprises pour les prestations réalisées.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Annulation et remboursement</h2>

          <h3 className="font-medium mb-2">7.1 Annulation par l&apos;Entreprise</h3>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Plus de 48h avant la mission : remboursement intégral</li>
            <li>Entre 24h et 48h : remboursement de 50%</li>
            <li>Moins de 24h : aucun remboursement (sauf cas de force majeure)</li>
          </ul>

          <h3 className="font-medium mb-2">7.2 Annulation par le Chauffeur</h3>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Plus de 24h avant : aucune pénalité</li>
            <li>Moins de 24h : impact sur la note et le profil</li>
            <li>Annulations répétées : suspension possible du compte</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Litiges et réclamations</h2>
          <p className="text-muted-foreground">
            En cas de litige concernant une mission, les parties doivent d&apos;abord tenter de résoudre le différend à l&apos;amiable. PrestaPop peut intervenir en tant que médiateur.
          </p>
          <p className="text-muted-foreground mt-2">
            Les réclamations doivent être adressées dans un délai de 7 jours suivant la fin de la mission à : <a href="mailto:litiges@prestapop.com" className="text-primary hover:underline">litiges@prestapop.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Assurances</h2>
          <p className="text-muted-foreground">
            Les chauffeurs inscrits sur PrestaPop doivent disposer d&apos;une assurance responsabilité civile professionnelle couvrant leur activité de livraison. PrestaPop vérifie la validité de cette assurance lors de l&apos;inscription.
          </p>
          <p className="text-muted-foreground mt-2">
            PrestaPop ne saurait être tenu responsable des dommages causés aux marchandises pendant le transport.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. TVA</h2>
          <p className="text-muted-foreground">
            Les tarifs affichés sur la plateforme sont indiqués hors taxes (HT). La TVA applicable (20%) est ajoutée au moment du paiement pour les entreprises assujetties.
          </p>
          <p className="text-muted-foreground mt-2">
            Les auto-entrepreneurs en franchise de TVA facturent leurs prestations HT.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Modification des tarifs</h2>
          <p className="text-muted-foreground">
            PrestaPop se réserve le droit de modifier ses tarifs et commissions. Les utilisateurs seront informés par email au moins 30 jours avant l&apos;entrée en vigueur des nouveaux tarifs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question relative aux présentes CGV :<br />
            Email : <a href="mailto:commercial@prestapop.com" className="text-primary hover:underline">commercial@prestapop.com</a><br />
            Téléphone : [Numéro à compléter]
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8 pt-8 border-t">
          Dernière mise à jour : Janvier 2026
        </p>
      </div>
    </div>
  )
}
