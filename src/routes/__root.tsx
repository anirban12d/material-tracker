import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  )
}
