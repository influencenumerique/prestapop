import { Metadata } from "next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Truck, Building2, HelpCircle, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "FAQ - PrestaPop",
  description: "Questions frequentes sur les missions de transport et livraison urbaine",
}

const faqDrivers = [
  {
    question: "Comment devenir chauffeur sur PrestaPop ?",
    answer: "Inscrivez-vous gratuitement en cliquant sur 'Inscription chauffeur'. Completez votre profil avec vos informations personnelles, votre vehicule (type et volume), votre zone d'intervention et vos disponibilites. Ajoutez vos documents obligatoires (permis, assurance RC Pro, Kbis ou carte d'auto-entrepreneur). Une fois votre profil verifie, vous pourrez postuler aux missions."
  },
  {
    question: "Quels documents sont necessaires pour s'inscrire ?",
    answer: "Vous devez fournir : un permis de conduire valide, une attestation d'assurance responsabilite civile professionnelle, votre carte grise du vehicule, et votre numero SIRET (auto-entrepreneur) ou Kbis (societe). Ces documents sont verifies par notre equipe avant l'activation de votre compte."
  },
  {
    question: "Comment postuler a une mission ?",
    answer: "Parcourez les missions disponibles dans l'onglet 'Missions'. Filtrez par zone, volume de vehicule ou type de mission. Cliquez sur une mission pour voir les details, puis sur 'Postuler'. L'entreprise recevra votre candidature et pourra consulter votre profil avant de vous selectionner."
  },
  {
    question: "Comment suis-je paye ?",
    answer: "Une fois la mission terminee et validee par l'entreprise, le paiement est declenche automatiquement. Les fonds sont vires sur votre compte bancaire sous 48 a 72 heures ouvrees. La commission PrestaPop (15%) est deduite automatiquement du montant."
  },
  {
    question: "Quelle est la commission prelevee par PrestaPop ?",
    answer: "PrestaPop preleve une commission de 15% sur le montant de chaque mission realisee. Cette commission couvre l'acces a la plateforme, la mise en relation avec les entreprises, le systeme de paiement securise et l'assistance en cas de litige."
  },
  {
    question: "Puis-je annuler une mission apres l'avoir acceptee ?",
    answer: "Vous pouvez annuler une mission plus de 24h avant sans penalite. En dessous de 24h, l'annulation impactera votre note et votre profil. Les annulations repetees peuvent entrainer une suspension de votre compte."
  },
  {
    question: "Comment ameliorer ma visibilite sur la plateforme ?",
    answer: "Completez votre profil a 100%, ajoutez une photo professionnelle, maintenez une bonne note en realisant des missions de qualite. Les chauffeurs les mieux notes et les plus actifs apparaissent en priorite dans les recherches des entreprises."
  },
  {
    question: "Quel type de vehicule puis-je utiliser ?",
    answer: "PrestaPop accepte les vehicules utilitaires de 6m3 a 20m3. Vous devez declarer le volume exact de votre vehicule lors de l'inscription. Seules les missions correspondant a votre volume vous seront proposees."
  },
]

const faqCompanies = [
  {
    question: "Comment publier une mission de livraison ?",
    answer: "Creez votre compte entreprise gratuitement. Dans votre tableau de bord, cliquez sur 'Creer une mission'. Renseignez les details : type de mission, secteur de livraison, date et horaires, volume de vehicule requis, nombre de colis et tarif propose. Votre mission sera visible immediatement par les chauffeurs."
  },
  {
    question: "Comment fixer le tarif d'une mission ?",
    answer: "Les tarifs sont libres. A titre indicatif : demi-journee urbaine 80-120EUR, journee complete 140-180EUR (6m3), journee 12m3 160-220EUR, inter-urbain 180-280EUR, semaine complete 700-1200EUR. Des tarifs attractifs attirent plus de candidatures de chauffeurs qualifies."
  },
  {
    question: "Comment selectionner un chauffeur ?",
    answer: "Apres publication de votre mission, vous recevez les candidatures des chauffeurs interesses. Consultez leur profil, note, avis des autres entreprises et vehicule. Selectionnez le chauffeur qui correspond le mieux a vos besoins. Le paiement est alors securise jusqu'a la validation de la mission."
  },
  {
    question: "Quand et comment payer ?",
    answer: "Le paiement s'effectue par carte bancaire de maniere securisee (Stripe) au moment de la selection du chauffeur. Le montant est sequestre jusqu'a ce que vous validiez la mission terminee. Aucun montant n'est preleve avant la selection d'un chauffeur."
  },
  {
    question: "Quelle est la commission pour les entreprises ?",
    answer: "PrestaPop preleve une commission de 10% sur le montant de la mission, incluse dans le paiement. Cette commission couvre l'acces a la plateforme, la verification des chauffeurs, le systeme de paiement securise et l'assistance en cas de litige."
  },
  {
    question: "Puis-je annuler une mission ?",
    answer: "Oui. Plus de 48h avant : remboursement integral. Entre 24h et 48h : remboursement de 50%. Moins de 24h : pas de remboursement sauf cas de force majeure. Ces conditions protegent les chauffeurs qui ont reserve leur temps pour votre mission."
  },
  {
    question: "Comment gerer un litige avec un chauffeur ?",
    answer: "En cas de probleme, contactez d'abord le chauffeur via la messagerie de la plateforme. Si le litige persiste, signalez-le a notre equipe via litiges@prestapop.com dans les 7 jours suivant la mission. Notre equipe interviendra en tant que mediateur."
  },
  {
    question: "Les chauffeurs sont-ils assures ?",
    answer: "Oui, tous les chauffeurs inscrits sur PrestaPop doivent disposer d'une assurance responsabilite civile professionnelle couvrant leur activite de livraison. Nous verifions la validite de cette assurance lors de l'inscription et de chaque renouvellement."
  },
]

const faqGeneral = [
  {
    question: "Qu'est-ce que PrestaPop ?",
    answer: "PrestaPop est une plateforme de mise en relation B2B entre entreprises ayant des besoins de livraison urbaine et chauffeurs-livreurs independants. Nous facilitons la publication de missions, la selection de chauffeurs verifies et securisons les paiements."
  },
  {
    question: "PrestaPop est-il gratuit ?",
    answer: "L'inscription est gratuite pour tous, entreprises comme chauffeurs. PrestaPop se remunere uniquement par des commissions sur les missions realisees : 10% pour les entreprises et 15% pour les chauffeurs."
  },
  {
    question: "Dans quelles villes PrestaPop est-il disponible ?",
    answer: "PrestaPop est disponible dans toute la France. Nous couvrons les livraisons urbaines (intra-ville) et inter-urbaines (ville a ville). Lors de la creation de votre profil ou mission, indiquez simplement votre zone d'intervention."
  },
  {
    question: "Comment contacter le support PrestaPop ?",
    answer: "Pour toute question, contactez-nous par email a contact@prestapop.com. Pour les litiges concernant une mission, ecrivez a litiges@prestapop.com. Nous repondons sous 24 a 48 heures ouvrees."
  },
  {
    question: "Mes donnees personnelles sont-elles protegees ?",
    answer: "Oui, PrestaPop respecte le RGPD et la loi Informatique et Libertes. Vos donnees sont hebergees en France, securisees et ne sont jamais vendues a des tiers. Consultez notre politique de confidentialite pour plus de details."
  },
]

export default function FAQPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="text-center mb-12">
        <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Foire Aux Questions</h1>
        <p className="text-muted-foreground">
          Retrouvez les reponses aux questions les plus frequentes sur les missions de transport et livraison
        </p>
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <Card className="border-primary/20 hover:border-primary transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Vous etes chauffeur ?</h3>
              <p className="text-sm text-muted-foreground">Decouvrez comment postuler aux missions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 hover:border-primary transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Vous etes une entreprise ?</h3>
              <p className="text-sm text-muted-foreground">Apprenez a publier vos missions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-10">
        {/* Questions for Drivers */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Truck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Pour les chauffeurs</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqDrivers.map((faq, index) => (
              <AccordionItem key={index} value={`driver-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Questions for Companies */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Pour les entreprises</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqCompanies.map((faq, index) => (
              <AccordionItem key={index} value={`company-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* General Questions */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Questions generales</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqGeneral.map((faq, index) => (
              <AccordionItem key={index} value={`general-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>

      {/* Contact Section */}
      <div className="mt-12 bg-muted/50 rounded-xl p-8 text-center">
        <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Vous n&apos;avez pas trouve votre reponse ?</h2>
        <p className="text-muted-foreground mb-6">
          Notre equipe est disponible pour repondre a toutes vos questions
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="mailto:contact@prestapop.com">
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              contact@prestapop.com
            </Button>
          </a>
          <Link href="/register">
            <Button className="gap-2">
              Creer un compte gratuit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
