// ── src/components/ui/Button.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const baseClasses = cn(
    // Base styles with glassmorphism
    'relative inline-flex items-center justify-center font-semibold transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 overflow-hidden',
    
    // Enhanced border radius
    'rounded-2xl',
    
    // Glassmorphism backdrop
    'backdrop-blur-sm',
    
    // Variants with dark mode support
    {
      // Primary
      'bg-gradient-to-r from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 focus:ring-primary-300 dark:focus:ring-primary-400 border border-primary-400/20 dark:border-primary-500/30': 
        variant === 'primary',
      
      // Secondary
      'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-2 border-primary-200/50 dark:border-gray-600/50 text-primary-700 dark:text-primary-400 shadow-md hover:bg-white/90 dark:hover:bg-gray-700/90 hover:border-primary-300/60 dark:hover:border-primary-500/60 hover:shadow-lg hover:-translate-y-1 focus:ring-primary-300 dark:focus:ring-primary-400': 
        variant === 'secondary',
      
      // Danger
      'bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white shadow-lg hover:from-red-600 hover:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 hover:shadow-xl hover:-translate-y-1 focus:ring-red-300 dark:focus:ring-red-400 border border-red-400/20 dark:border-red-500/30': 
        variant === 'danger',
      
      // Ghost
      'bg-transparent text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 hover:text-primary-700 dark:hover:text-primary-300 focus:ring-primary-300 dark:focus:ring-primary-400 backdrop-blur-sm': 
        variant === 'ghost',
      
      // Outline
      'bg-transparent border-2 border-primary-400 dark:border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:ring-primary-300 dark:focus:ring-primary-400 backdrop-blur-sm': 
        variant === 'outline',
    },
    
    // Enhanced sizes
    {
      'px-2 py-1.5 text-xs': size === 'xs',
      'px-3 py-2 text-sm': size === 'sm',
      'px-6 py-3 text-base': size === 'md',
      'px-8 py-4 text-lg': size === 'lg',
      'px-10 py-5 text-xl': size === 'xl',
      'px-12 py-8 text-2xl rounded-3xl': size === 'xxl', // Extra large for tactile use
    },
    
    // Loading state
    {
      'pointer-events-none': isLoading,
    },
    
    className
  )

  return (
    <button
      ref={ref}
      className={baseClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shine effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center">
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {leftIcon && !isLoading && (
          <span className="mr-2 transition-transform group-hover:scale-110">{leftIcon}</span>
        )}
        
        <span className="font-semibold">{children}</span>
        
        {rightIcon && !isLoading && (
          <span className="ml-2 transition-transform group-hover:scale-110">{rightIcon}</span>
        )}
      </div>
    </button>
  )
})

Button.displayName = 'Button'

// Enhanced specialized button variants
export const FeedingButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => (
    <Button 
      ref={ref} 
      variant="primary" 
      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 focus:ring-blue-300 border-blue-400/20" 
      {...props} 
    />
  )
)
FeedingButton.displayName = 'FeedingButton'

export const SleepButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => (
    <Button 
      ref={ref} 
      variant="primary" 
      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:ring-purple-300 border-purple-400/20" 
      {...props} 
    />
  )
)
SleepButton.displayName = 'SleepButton'

export const GrowthButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => (
    <Button 
      ref={ref} 
      variant="primary" 
      className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 focus:ring-indigo-300 border-indigo-400/20" 
      {...props} 
    />
  )
)
GrowthButton.displayName = 'GrowthButton'

export const ChecklistButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => (
    <Button 
      ref={ref} 
      variant="primary" 
      className="bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700 focus:ring-primary-300 border-primary-400/20" 
      {...props} 
    />
  )
)
ChecklistButton.displayName = 'ChecklistButton'

// Enhanced XXL Tactile Button for main actions
export const TactileButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'>>(
  ({ className, children, leftIcon, rightIcon, ...props }, ref) => (
    <Button
      ref={ref}
      size="xxl"
      className={cn(
        'w-40 h-40 rounded-3xl flex-col text-center shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95 relative overflow-hidden',
        // Enhanced glassmorphism for tactile buttons with dark mode
        'bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-700/50',
        'hover:from-white/95 hover:to-white/80 dark:hover:from-gray-700/95 dark:hover:to-gray-800/80',
        className
      )}
      {...props}
    >
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-2 w-1 h-1 bg-primary-400/30 rounded-full animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute top-8 right-4 w-1 h-1 bg-primary-500/20 rounded-full animate-float" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-6 left-6 w-1 h-1 bg-primary-300/40 rounded-full animate-float" style={{animationDelay: '2s'}} />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {leftIcon && <div className="text-5xl mb-3 filter drop-shadow-sm">{leftIcon}</div>}
        <div className="text-lg font-bold leading-tight text-primary-700 dark:text-primary-300">{children}</div>
        {rightIcon && <div className="text-3xl mt-2 filter drop-shadow-sm">{rightIcon}</div>}
      </div>
    </Button>
  )
)
TactileButton.displayName = 'TactileButton'

export default Button