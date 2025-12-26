import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth'
import { NotFound } from '@/components/not-found'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  )
}
