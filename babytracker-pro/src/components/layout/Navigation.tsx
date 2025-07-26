// ── src/components/layout/Navigation.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Milk, Moon, BarChart, ListChecks, Baby, Droplets, Heart, Brain } from 'lucide-react'

const tabs = [
  { href: '/feeding',       icon: Milk,        label: 'Repas'     },
  { href: '/sleep',         icon: Moon,        label: 'Sommeil'   },
  { href: '/diaper',        icon: Droplets,    label: 'Couches'   },
  { href: '/growth',        icon: BarChart,    label: 'Croissance'},
  { href: '/health',        icon: Heart,       label: 'Santé'     },
  { href: '/parent-health', icon: Brain,       label: 'Parent'    },
  { href: '/checklist',     icon: ListChecks,  label: 'Checklist' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-900/95 nav-glass backdrop-blur-25 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-center max-w-2xl mx-auto px-2">
        <div className="grid grid-cols-7 gap-2">
          {tabs.map(tab => {
            const ActiveIcon = tab.icon
            const active = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200 min-w-0 ${
                  active 
                    ? 'active bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <ActiveIcon className="h-5 w-5" />
                <span className="text-xs leading-tight mt-1 text-center truncate w-full">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}