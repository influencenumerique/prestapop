import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentions légales - PrestaPop",
  description: "Mentions légales de la plateforme PrestaPop",
}

export default function MentionsLegalesPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Mentions légales</h1>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Éditeur du site</h2>
          <p className="text-muted-foreground">
            Le site PrestaPop est édité par :<br />
            <strong>PrestaPop SAS</strong><br />
            [Adresse du siège social]<br />
            Capital social : [Montant] euros<br />
            RCS : [Ville] [Numéro]<br />
            SIRET : [Numéro SIRET]<br />
            TVA intracommunautaire : [Numéro TVA]
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Directeur de la publication</h2>
          <p className="text-muted-foreground">
            [Nom du directeur de publication]<br />
            Email : contact@prestapop.com
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Hébergeur</h2>
          <p className="text-muted-foreground">
            Le site est hébergé par :<br />
            [Nom de l&apos;hébergeur]<br />
            [Adresse de l&apos;hébergeur]<br />
            [Contact de l&apos;hébergeur]
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            L&apos;ensemble des éléments constituant le site PrestaPop (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données, etc.) ainsi que le site lui-même, relèvent des législations françaises et internationales sur le droit d&apos;auteur et la propriété intellectuelle.
          </p>
          <p className="text-muted-foreground mt-2">
            Ces éléments sont la propriété exclusive de PrestaPop SAS. Toute reproduction, représentation, utilisation ou adaptation, sous quelque forme que ce soit, de tout ou partie de ces éléments, sans l&apos;accord préalable et écrit de PrestaPop SAS, est strictement interdite.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Données personnelles</h2>
          <p className="text-muted-foreground">
            Les informations recueillies sur ce site font l&apos;objet d&apos;un traitement informatique destiné à la gestion des services proposés par PrestaPop. Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression des données vous concernant.
          </p>
          <p className="text-muted-foreground mt-2">
            Pour exercer ces droits, veuillez nous contacter à : dpo@prestapop.com
          </p>
          <p className="text-muted-foreground mt-2">
            Pour plus d&apos;informations, consultez notre <a href="/confidentialite" className="text-primary hover:underline">politique de confidentialité</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Cookies</h2>
          <p className="text-muted-foreground">
            Le site PrestaPop utilise des cookies pour améliorer l&apos;expérience utilisateur. En naviguant sur ce site, vous acceptez l&apos;utilisation de cookies conformément à notre politique de cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Limitation de responsabilité</h2>
          <p className="text-muted-foreground">
            PrestaPop SAS s&apos;efforce d&apos;assurer au mieux l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, PrestaPop SAS ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition sur ce site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Droit applicable</h2>
          <p className="text-muted-foreground">
            Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8 pt-8 border-t">
          Dernière mise à jour : Janvier 2026
        </p>
      </div>
    </div>
  )
}
