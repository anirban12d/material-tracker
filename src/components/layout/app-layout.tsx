import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useAuth } from '@/features/auth'
import { Spinner } from '@/components/loaders'
import { Header } from './header'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, signOut, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !user) {
      router.navigate({ to: '/login' })
    }
  }, [isLoading, user, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated (redirect will happen)
  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <Header user={user} profile={profile} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="container flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
