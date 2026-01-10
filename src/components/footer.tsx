import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto py-6 px-4">
        {/* Logo centré */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-2">
            <Image
              src="/images/logo-light.png"
              alt="PrestaPop"
              width={400}
              height={110}
              className="h-[108px] w-auto"
            />
          </Link>
          <p className="text-sm text-muted-foreground">
            Plateforme B2B pour vos livraisons urbaines.
          </p>
        </div>

        {/* Colonnes de liens centrées */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-12 text-center">
            {/* Chauffeurs */}
            <div>
              <h3 className="font-semibold text-base mb-3">Chauffeurs</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/jobs" className="text-muted-foreground hover:text-primary">
                    Missions
                  </Link>
                </li>
                <li>
                  <Link href="/register?type=driver" className="text-muted-foreground hover:text-primary">
                    S&apos;inscrire
                  </Link>
                </li>
              </ul>
            </div>

            {/* Entreprises */}
            <div>
              <h3 className="font-semibold text-base mb-3">Entreprises</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/register?type=company" className="text-muted-foreground hover:text-primary">
                    Publier
                  </Link>
                </li>
                <li>
                  <Link href="/drivers" className="text-muted-foreground hover:text-primary">
                    Chauffeurs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h3 className="font-semibold text-base mb-3">Légal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/cgu" className="text-muted-foreground hover:text-primary">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="text-muted-foreground hover:text-primary">
                    Confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright - centré */}
        <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PrestaPop · <a href="mailto:contact@prestapop.com" className="hover:text-primary">contact@prestapop.com</a></p>
        </div>
      </div>
    </footer>
  )
}
