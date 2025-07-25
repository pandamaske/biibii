// ── src/components/ui/Card.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  hover?: boolean
  children: React.ReactNode
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  rounded = 'xl',
  shadow = 'md',
  hover = false,
  className,
  children,
  ...props
}, ref) => {
  const baseClasses = cn(
    // Enhanced base styles
    'relative transition-all duration-300 ease-out overflow-hidden',
    
    // Variants with glassmorphism and dark mode
    {
      // Default with glassmorphism
      'bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-white/30 dark:border-gray-700/30': variant === 'default',
      
      // Elevated with enhanced shadow
      'bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-white/40 dark:border-gray-700/40': variant === 'elevated',
      
      // Outlined with subtle background
      'bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border-2 border-primary-200/60 dark:border-gray-600/60': variant === 'outlined',
      
      // Gradient with overlay
      'bg-gradient-to-br from-white/95 to-primary-50/80 dark:from-gray-800/95 dark:to-gray-700/80 backdrop-blur-md border border-white/30 dark:border-gray-700/30': variant === 'gradient',
      
      // Full glass effect
      'bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30': variant === 'glass',
    },
    
    // Enhanced padding
    {
      'p-0': padding === 'none',
      'p-4': padding === 'sm',
      'p-6': padding === 'md',
      'p-8': padding === 'lg',
      'p-10': padding === 'xl',
    },
    
    // Enhanced rounded corners
    {
      'rounded-lg': rounded === 'sm',
      'rounded-xl': rounded === 'md',
      'rounded-2xl': rounded === 'lg' || rounded === 'xl',
      'rounded-3xl': rounded === '2xl' || rounded === '3xl',
    },
    
    // Enhanced shadow system
    {
      'shadow-none': shadow === 'none',
      'shadow-soft': shadow === 'sm',
      'shadow-medium': shadow === 'md',
      'shadow-large': shadow === 'lg',
      'shadow-xl': shadow === 'xl',
      'shadow-2xl': shadow === '2xl',
    },
    
    // Enhanced hover effects
    {
      'hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] cursor-pointer': hover && shadow !== '2xl',
      'hover:shadow-2xl hover:-translate-y-3 hover:scale-[1.02] cursor-pointer': hover && shadow === '2xl',
      'group': hover,
    },
    
    className
  )

  return (
    <div ref={ref} className={baseClasses} {...props}>
      {/* Subtle shine effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Hover glow effect */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-primary-400/10 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </div>
  )
})

Card.displayName = 'Card'

// Enhanced Card sub-components
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 pb-6 relative', className)}
    {...props}
  >
    {children}
    {/* Subtle separator */}
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200/50 to-transparent" />
  </div>
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}>(({
  className,
  children,
  as: Component = 'h3',
  ...props
}, ref) => (
  <Component
    ref={ref}
    className={cn(
      'text-xl font-bold leading-none tracking-tight',
      'bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent',
      className
    )}
    {...props}
  >
    {children}
  </Component>
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-300 leading-relaxed', className)}
    {...props}
  >
    {children}
  </p>
))
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('pt-0', className)}
    {...props}
  >
    {children}
  </div>
))
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-6 relative', className)}
    {...props}
  >
    {/* Subtle separator */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200/50 to-transparent" />
    {children}
  </div>
))
CardFooter.displayName = 'CardFooter'

// Enhanced specialized cards for baby tracker
interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'gray'
  trend?: 'up' | 'down' | 'stable'
  className?: string
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  className,
  ...props
}, ref) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-cyan-600/10 border-blue-200/50',
    purple: 'from-purple-500/10 to-indigo-600/10 border-purple-200/50',
    green: 'from-primary-500/10 to-emerald-600/10 border-primary-200/50',
    amber: 'from-amber-500/10 to-orange-600/10 border-amber-200/50',
    red: 'from-red-500/10 to-pink-600/10 border-red-200/50',
    gray: 'from-gray-500/10 to-slate-600/10 border-gray-200/50',
  }

  const iconColorClasses = {
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-indigo-600',
    green: 'from-primary-500 to-emerald-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-pink-600',
    gray: 'from-gray-500 to-slate-600',
  }

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '→',
  }

  return (
    <Card
      ref={ref}
      variant="glass"
      padding="lg"
      hover
      className={cn(
        'relative overflow-hidden border-2',
        `bg-gradient-to-br ${colorClasses[color]}`,
        className
      )}
      {...props}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-2 right-2 w-20 h-20 rounded-full bg-current" />
        <div className="absolute bottom-2 left-2 w-12 h-12 rounded-full bg-current" />
      </div>
      
      <div className="relative z-10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {title}
            </CardTitle>
            {icon && (
              <div className={`p-3 rounded-xl bg-gradient-to-r ${iconColorClasses[color]} text-white shadow-lg`}>
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </div>
            {trend && (
              <div className="text-lg">
                {trendIcons[trend]}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {subtitle}
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  )
})
StatsCard.displayName = 'StatsCard'

// Enhanced Activity Card for recent events
interface ActivityCardProps {
  icon: React.ReactNode
  title: string
  time: string
  description?: string
  color?: 'blue' | 'purple' | 'green' | 'amber'
  className?: string
  onClick?: () => void
}

export const ActivityCard = React.forwardRef<HTMLDivElement, ActivityCardProps>(({
  icon,
  title,
  time,
  description,
  color = 'blue',
  className,
  onClick,
  ...props
}, ref) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-200/50',
    green: 'bg-primary-500/10 text-primary-600 border-primary-200/50',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
  }

  return (
    <Card
      ref={ref}
      hover={!!onClick}
      variant="glass"
      className={cn('cursor-pointer border', colorClasses[color].split(' ')[2], className)}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-2xl flex-shrink-0 ${colorClasses[color]}`}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 font-medium">
              {time}
            </p>
          </div>
          
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
})
ActivityCard.displayName = 'ActivityCard'

export default Card