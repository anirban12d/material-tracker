import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import {
  materialRequestSchema,
  type MaterialRequestFormData,
} from '../../types'
import { PRIORITY_OPTIONS, UNIT_OPTIONS } from '../../constants'
import { useCreateMaterialRequest, useUpdateMaterialRequest } from '../../hooks'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { MaterialRequest } from '@/lib/supabase'
import { toast } from 'sonner'

interface MaterialRequestFormProps {
  mode: 'create' | 'edit'
  initialData?: MaterialRequest
}

export function MaterialRequestForm({
  mode,
  initialData,
}: MaterialRequestFormProps) {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const createMutation = useCreateMaterialRequest({
    onSuccess: () => {
      toast.success('Material request created successfully')
      navigate({ to: '/material-requests' })
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`)
    },
  })

  const updateMutation = useUpdateMaterialRequest({
    onSuccess: () => {
      toast.success('Material request updated successfully')
      navigate({ to: '/material-requests' })
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`)
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaterialRequestFormData>({
    resolver: zodResolver(materialRequestSchema),
    defaultValues: {
      material_name: initialData?.material_name ?? '',
      quantity: initialData?.quantity ?? 0,
      unit: initialData?.unit ?? 'pieces',
      priority: initialData?.priority ?? 'medium',
      notes: initialData?.notes ?? '',
      project_id: initialData?.project_id ?? null,
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: MaterialRequestFormData) => {
    if (mode === 'create') {
      if (!user || !profile?.company_id) {
        toast.error('User profile not found. Please try logging in again.')
        return
      }
      createMutation.mutate({
        material_name: data.material_name,
        quantity: data.quantity,
        unit: data.unit,
        priority: data.priority,
        notes: data.notes || null,
        project_id: data.project_id || null,
        status: 'pending',
        requested_by: user.id,
        company_id: profile.company_id,
      })
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        data: {
          material_name: data.material_name,
          quantity: data.quantity,
          unit: data.unit,
          priority: data.priority,
          notes: data.notes || null,
          project_id: data.project_id || null,
        },
      })
    }
  }

  const selectedUnit = watch('unit')
  const selectedPriority = watch('priority')

  return (
    <Card className="mx-auto w-full max-w-2xl border-border">
      <CardHeader className="space-y-1 pb-4 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">
          {mode === 'create' ? 'New Material Request' : 'Edit Material Request'}
        </CardTitle>
        <CardDescription className="text-sm">
          {mode === 'create'
            ? 'Create a new material request for your project'
            : 'Update the details of this material request'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 sm:space-y-6 sm:pb-2">
          {mode === 'create' && !profile?.company_id && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account setup is incomplete. Please contact support or try
                signing out and back in.
              </AlertDescription>
            </Alert>
          )}

          {/* Material Name */}
          <div className="space-y-2">
            <Label htmlFor="material_name" className="text-sm font-medium">
              Material Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="material_name"
              placeholder="e.g., Concrete, Steel Beams, Plywood"
              {...register('material_name')}
              aria-invalid={errors.material_name ? 'true' : 'false'}
              className="h-10"
            />
            {errors.material_name && (
              <p className="text-xs text-destructive sm:text-sm">
                {errors.material_name.message}
              </p>
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register('quantity', { valueAsNumber: true })}
                aria-invalid={errors.quantity ? 'true' : 'false'}
                className="h-10"
              />
              {errors.quantity && (
                <p className="text-xs text-destructive sm:text-sm">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium">
                Unit <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedUnit}
                onValueChange={(value: string) =>
                  setValue('unit', value as MaterialRequestFormData['unit'])
                }
              >
                <SelectTrigger id="unit" className="h-10">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-xs text-destructive sm:text-sm">
                  {errors.unit.message}
                </p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedPriority}
              onValueChange={(value: string) =>
                setValue(
                  'priority',
                  value as MaterialRequestFormData['priority'],
                )
              }
            >
              <SelectTrigger id="priority" className="h-10">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-xs text-destructive sm:text-sm">
                {errors.priority.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or specifications..."
              rows={4}
              {...register('notes')}
              className="h-24 resize-none overflow-y-auto"
            />
            {errors.notes && (
              <p className="text-xs text-destructive sm:text-sm">
                {errors.notes.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 pt-4 sm:flex-row sm:justify-between sm:pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: '/material-requests' })}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Request' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
