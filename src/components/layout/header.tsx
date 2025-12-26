import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Package, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase'

interface HeaderProps {
  user: User
  profile: Profile | null
  onSignOut: () => void
}

export function Header({ user, profile, onSignOut }: HeaderProps) {
  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.slice(0, 2).toUpperCase() ?? 'U')

  return (
    <header className="z-50 w-full flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between sm:h-16">
        <Link
          to="/material-requests"
          className="flex items-center gap-2 font-semibold"
        >
          <Package className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          <span className="text-base sm:text-lg">Material Tracker</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full sm:h-9 sm:w-9"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground sm:text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name ?? 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
