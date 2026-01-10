"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageCircle, X, Send, Bot } from "lucide-react"

interface Message {
  id: number
  text: string
  isBot: boolean
}

// FAQ intégrée
const faqData = [
  {
    keywords: ["inscription", "inscrire", "créer compte", "s'inscrire", "compte"],
    question: "Comment m'inscrire sur PrestaPop ?",
    answer: "Pour vous inscrire, cliquez sur 'S'inscrire' en haut à droite. Choisissez votre profil (Entreprise ou Chauffeur), remplissez le formulaire avec vos informations et validez. L'inscription est gratuite et sans engagement."
  },
  {
    keywords: ["gratuit", "prix", "coût", "tarif", "payer", "commission", "frais"],
    question: "L'inscription est-elle gratuite ?",
    answer: "Oui, l'inscription est 100% gratuite pour les entreprises comme pour les chauffeurs. PrestaPop prélève une commission uniquement sur les missions réalisées avec succès."
  },
  {
    keywords: ["chauffeur", "devenir chauffeur", "livreur", "conducteur"],
    question: "Comment devenir chauffeur sur PrestaPop ?",
    answer: "Pour devenir chauffeur : 1) Créez votre compte chauffeur, 2) Complétez votre profil avec vos informations et documents (permis, assurance, Kbis si auto-entrepreneur), 3) Une fois vérifié, vous pouvez postuler aux missions disponibles."
  },
  {
    keywords: ["mission", "publier", "poster", "créer mission", "annonce"],
    question: "Comment publier une mission ?",
    answer: "Connectez-vous à votre espace entreprise, cliquez sur 'Publier une mission', remplissez les détails (secteur, nombre de colis, tarif journalier, type de véhicule requis) et validez. Les chauffeurs disponibles pourront postuler immédiatement."
  },
  {
    keywords: ["paiement", "payer", "règlement", "virement", "argent"],
    question: "Comment fonctionne le paiement ?",
    answer: "Le paiement est sécurisé via notre plateforme. L'entreprise paie à la validation de la mission, les fonds sont bloqués, puis libérés au chauffeur une fois la mission terminée et validée. Les virements sont effectués sous 48-72h."
  },
  {
    keywords: ["véhicule", "voiture", "camion", "utilitaire", "van", "vélo", "scooter"],
    question: "Quels types de véhicules sont acceptés ?",
    answer: "PrestaPop accepte tous types de véhicules : vélo cargo, scooter, voiture, utilitaire (6m³ à 20m³) et camion. Chaque mission précise le volume requis pour que vous puissiez postuler aux offres adaptées à votre véhicule."
  },
  {
    keywords: ["annuler", "annulation", "supprimer", "résilier"],
    question: "Puis-je annuler une mission ?",
    answer: "Oui, mais des conditions s'appliquent. Annulation gratuite jusqu'à 24h avant la mission. Entre 24h et 12h : 50% de frais. Moins de 12h : 100% de frais. En cas de force majeure, contactez notre support."
  },
  {
    keywords: ["contact", "support", "aide", "problème", "assistance", "joindre"],
    question: "Comment contacter le support ?",
    answer: "Vous pouvez nous contacter par email à contact@prestapop.com ou via ce chat. Notre équipe répond généralement sous 24h en jours ouvrés."
  },
  {
    keywords: ["vérification", "vérifié", "badge", "confiance", "sécurité"],
    question: "Comment sont vérifiés les chauffeurs ?",
    answer: "Chaque chauffeur passe par une vérification : contrôle d'identité, permis de conduire, attestation d'assurance, et statut professionnel (auto-entrepreneur ou société). Les 'Super Chauffeurs' ont en plus un historique exemplaire sur la plateforme."
  },
  {
    keywords: ["zone", "ville", "région", "secteur", "où", "localisation"],
    question: "Dans quelles zones PrestaPop est disponible ?",
    answer: "PrestaPop est disponible dans toute la France, principalement en Île-de-France, Lyon, Marseille, Bordeaux, Lille et Nantes. Nous nous développons rapidement dans d'autres régions."
  },
  {
    keywords: ["urgent", "urgence", "rapide", "immédiat", "aujourd'hui"],
    question: "Puis-je trouver un chauffeur en urgence ?",
    answer: "Oui ! Utilisez le bouton 'Mission URGENTE' pour publier une demande prioritaire. Les chauffeurs disponibles immédiatement (badge 'DISPO') seront notifiés en priorité et peuvent accepter dans l'heure."
  },
  {
    keywords: ["note", "avis", "évaluation", "notation", "feedback"],
    question: "Comment fonctionne le système de notation ?",
    answer: "Après chaque mission, entreprises et chauffeurs peuvent se noter mutuellement (1 à 5 étoiles) et laisser un commentaire. Ces avis sont publics et aident la communauté à choisir les meilleurs partenaires."
  },
]

// Suggestions rapides
const quickSuggestions = [
  "Comment m'inscrire ?",
  "L'inscription est-elle gratuite ?",
  "Comment publier une mission ?",
  "Comment fonctionne le paiement ?",
]

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Bonjour ! Je suis l'assistant PrestaPop. Comment puis-je vous aider ?",
      isBot: true,
    },
  ])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findAnswer = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    // Chercher une correspondance dans la FAQ
    for (const faq of faqData) {
      for (const keyword of faq.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          return faq.answer
        }
      }
    }

    // Réponse par défaut
    return "Je n'ai pas trouvé de réponse précise à votre question. Vous pouvez consulter notre FAQ complète sur /faq ou nous contacter à contact@prestapop.com. Sinon, essayez de reformuler votre question !"
  }

  const handleSend = (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText) return

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      isBot: false,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Simuler un délai de réponse
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: findAnswer(messageText),
        isBot: true,
      }
      setMessages((prev) => [...prev, botResponse])
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] flex flex-col shadow-2xl border-2">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Assistant PrestaPop</h3>
                <p className="text-xs opacity-90">En ligne - Répond instantanément</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    message.isBot
                      ? "bg-white text-slate-800 shadow-sm border"
                      : "bg-primary text-white"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.isBot && (
                      <Bot className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    )}
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t bg-white">
              <p className="text-xs text-muted-foreground mb-2">Questions fréquentes :</p>
              <div className="flex flex-wrap gap-1">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={() => handleSend()}
                size="icon"
                className="rounded-full shrink-0"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
