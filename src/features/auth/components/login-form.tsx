import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2, Package, WifiOff } from 'lucide-react'
import { ErrorCode } from '@/lib/errors'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface ErrorState {
  message: string
  isNetworkError: boolean
}

export function LoginForm() {
  const [error, setError] = useState<ErrorState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        // error is already an AppError from the auth provider
        setError({
          message: error.userMessage,
          isNetworkError: error.code === ErrorCode.NETWORK_OFFLINE,
        })
        setIsLoading(false)
        return
      }

      // Clear all cached queries to ensure fresh data with new session
      queryClient.clear()

      // Navigate after successful sign in
      router.navigate({ to: '/material-requests' })
    } catch (err) {
      setError({
        message: 'An unexpected error occurred. Please try again.',
        isNetworkError: false,
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md">
      {/* Logo */}
      <div className="mb-6 flex items-center justify-center gap-2 sm:mb-8">
        <Package className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
        <span className="text-xl font-bold sm:text-2xl">Material Tracker</span>
      </div>

      <Card className="border-border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl sm:text-2xl">Welcome back</CardTitle>
          <CardDescription className="text-sm">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2 text-sm">
                {error.isNetworkError ? (
                  <WifiOff className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="text-sm font-medium">
                  {error.isNetworkError ? 'Connection Error' : 'Login Failed'}
                </AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
                className="h-10"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
                className="h-10"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex sm:mt-6 flex-col gap-4">
            <Button type="submit" className="h-10 w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
