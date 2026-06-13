import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn('fixed bottom-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 p-0 sm:max-w-[400px]', className)}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-lg shadow-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'bg-blue-500 text-white',
        destructive: 'bg-red-500 text-white',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-400 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const variantProgressColor: Record<string, string> = {
  default: 'bg-blue-300/60',
  destructive: 'bg-red-300/60',
  success: 'bg-green-300/60',
  warning: 'bg-yellow-200/60',
}

const variantIcon: Record<string, React.ReactNode> = {
  default: <Info className="h-8 w-8 text-white" />,
  destructive: <XCircle className="h-8 w-8 text-white" />,
  success: <CheckCircle2 className="h-8 w-8 text-white" />,
  warning: <AlertTriangle className="h-8 w-8 text-white" />,
}

const TOAST_DURATION = 4000

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  const v = variant ?? 'default'
  const progressColor = variantProgressColor[v] ?? variantProgressColor.default
  const icon = variantIcon[v] ?? variantIcon.default

  return (
    <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props}>
      {/* Main content row */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-white/20 p-1">{icon}</div>
        <div className="flex-1 min-w-0">{children}</div>
        <ToastPrimitive.Close
          className="shrink-0 rounded-md p-1 text-white/70 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          toast-close=""
        >
          <X className="h-4 w-4" />
        </ToastPrimitive.Close>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-black/10">
        <div
          className={cn('h-full', progressColor)}
          style={{
            animation: `toast-progress ${TOAST_DURATION}ms linear forwards`,
          }}
        />
      </div>
    </ToastPrimitive.Root>
  )
})
Toast.displayName = ToastPrimitive.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn('inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-white/30 bg-transparent px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:pointer-events-none disabled:opacity-50', className)}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitive.Action.displayName

// Keep for API compatibility — close button is now rendered inside Toast
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('rounded-md p-1 text-white/70 transition-colors hover:text-white focus:outline-none', className)}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-bold leading-tight', className)} {...props} />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm text-white/90 mt-0.5', className)} {...props} />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export { type ToastProps, type ToastActionElement, ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction }
