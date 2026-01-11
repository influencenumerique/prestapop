"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { VerificationUploadModal } from "@/components/verification-upload-modal"

export default function TestUploadPage() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<"DRIVER" | "COMPANY">("DRIVER")

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-2xl font-bold mb-8">Test Upload Modal</h1>

      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            variant={role === "DRIVER" ? "default" : "outline"}
            onClick={() => setRole("DRIVER")}
          >
            Test Driver
          </Button>
          <Button
            variant={role === "COMPANY" ? "default" : "outline"}
            onClick={() => setRole("COMPANY")}
          >
            Test Company
          </Button>
        </div>

        <Button onClick={() => setOpen(true)}>
          Ouvrir modal vérification ({role})
        </Button>
      </div>

      <VerificationUploadModal
        open={open}
        onOpenChange={setOpen}
        userRole={role}
      />

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Pour tester l&apos;upload Cloudinary, configurez:
        </p>
        <pre className="mt-2 text-xs bg-background p-2 rounded">
{`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="votre-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="prestapop_docs"`}
        </pre>
        <p className="text-sm text-muted-foreground mt-2">
          Sans ces variables, le fallback avec drag/drop natif sera utilisé.
        </p>
      </div>
    </div>
  )
}
