import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
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
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Package,
  WifiOff,
} from 'lucide-react'
import { ErrorCode } from '@/lib/errors'

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

interface ErrorState {
  message: string
  isNetworkError: boolean
}

export function SignupForm() {
  const [error, setError] = useState<ErrorState | null>(null)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(data: SignupFormData) {
    setError(null)
    const { error } = await signUp(data.email, data.password, data.fullName)

    if (error) {
      // error is already an AppError from the auth provider
      setError({
        message: error.userMessage,
        isNetworkError: error.code === ErrorCode.NETWORK_OFFLINE,
      })
      return
    }

    setSuccess(true)
    setTimeout(() => {
      navigate({ to: '/login' })
    }, 3000)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 sm:mb-8">
          <Package className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
          <span className="text-xl font-bold sm:text-2xl">
            Material Tracker
          </span>
        </div>
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">
              Account Created
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Please check your email to verify your account. You will be
              redirected to the login page shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md">
      <div className="mb-6 flex items-center justify-center gap-2 sm:mb-8">
        <Package className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
        <span className="text-xl font-bold sm:text-2xl">Material Tracker</span>
      </div>

      <Card className="border-border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl sm:text-2xl">
            Create an account
          </CardTitle>
          <CardDescription className="text-sm">
            Enter your details to create your account
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
                  {error.isNetworkError ? 'Connection Error' : 'Signup Failed'}
                </AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                {...register('fullName')}
                aria-invalid={errors.fullName ? 'true' : 'false'}
                className="h-10"
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

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
                placeholder="Create a password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
                className="h-10"
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                className="h-10"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex sm:mt-6 flex-col gap-4">
            <Button
              type="submit"
              className="h-10 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
