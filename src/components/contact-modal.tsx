'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Loader2, Mail, Phone, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ContactUser {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface ContactModalProps {
  user: ContactUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactModal({ user, open, onOpenChange }: ContactModalProps) {
  const [subject, setSubject] = useState('Message de PrestaPop')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setSubject('Message de PrestaPop')
    setMessage('')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copié`)
    } catch {
      toast.error('Erreur lors de la copie')
    }
  }

  const handleSendEmail = async () => {
    if (!user || !message.trim()) {
      toast.error('Veuillez saisir un message')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Envoi en cours...')

    try {
      const res = await fetch('/api/admin/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          userName: user.name,
          subject,
          message,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      toast.success('Email envoyé avec succès', { id: toastId })
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-400" />
            Contacter {user.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Envoyez un email ou copiez les coordonnées.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label className="text-gray-300">Email</Label>
            <div className="flex gap-2">
              <Input
                value={user.email}
                readOnly
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white shrink-0"
                onClick={() => copyToClipboard(user.email, 'Email')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Téléphone */}
          {user.phone && (
            <div className="space-y-2">
              <Label className="text-gray-300">Téléphone</Label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <Input
                    value={user.phone}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white shrink-0"
                  onClick={() => copyToClipboard(user.phone!, 'Téléphone')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <hr className="border-slate-700" />

          {/* Subject */}
          <div className="space-y-2">
            <Label className="text-gray-300">Sujet</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de l'email"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-gray-300">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message..."
              rows={4}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSendEmail}
            disabled={loading || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
