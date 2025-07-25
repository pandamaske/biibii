'use client'

import React, { useState } from 'react'
import { Bell, Menu, ChevronDown, Settings, User, LogOut, Baby, Home, Milk, Moon, TrendingUp, CheckSquare } from 'lucide-react'

// ✅ Hook pour simuler les données
const useAppData = () => {
  const [currentPage, setCurrentPage] = useState('Accueil')
  const [notificationCount, setNotificationCount] = useState(3)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const user = {
    name: 'Sophie Martin',
    avatar: '👩‍🦰',
    babyName: 'Lucas',
    babyAge: '4 mois'
  }

  const pages = [
    { id: 'home', name: 'Accueil', icon: Home },
    { id: 'feeding', name: 'Repas', icon: Milk },
    { id: 'sleep', name: 'Sommeil', icon: Moon },
    { id: 'growth', name: 'Croissance', icon: TrendingUp },
    { id: 'checklist', name: 'Checklist', icon: CheckSquare }
  ]

  return {
    currentPage,
    setCurrentPage,
    notificationCount,
    setNotificationCount,
    isMenuOpen,
    setIsMenuOpen,
    isProfileOpen,
    setIsProfileOpen,
    user,
    pages
  }
}

// ✅ Header Variant 1: Glassmorphism moderne
const HeaderVariant1 = ({ data }: { data: any }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-white/20 shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Page Title */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {data.currentPage}
              </h1>
              <p className="text-sm text-gray-400">{data.user.babyName} • {data.user.babyAge}</p>
            </div>
          </div>

          {/* Right Side: Notifications + Avatar + Menu */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button 
              onClick={() => data.setNotificationCount(0)}
              className="relative p-2 hover:bg-primary-50 rounded-xl transition-all duration-300 transform hover:scale-110"
            >
              <Bell className="w-6 h-6 " />
              {data.notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs font-bold text-white">{data.notificationCount}</span>
                </div>
              )}
            </button>

            {/* User Avatar */}
            <button 
              onClick={() => data.setIsProfileOpen(!data.isProfileOpen)}
              className="flex items-center space-x-2 p-2 hover:bg-primary-50 rounded-2xl transition-all duration-300 transform hover:scale-105 relative"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg">
                {data.user.avatar}
              </div>
              <ChevronDown className={`w-4 h-4  transition-transform duration-300 ${data.isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Burger Menu */}
            <button 
              onClick={() => data.setIsMenuOpen(!data.isMenuOpen)}
              className="p-2 hover:bg-primary-50 rounded-xl transition-all duration-300 transform hover:scale-110"
            >
              <Menu className="w-6 h-6 " />
            </button>
          </div>
        </div>

        {/* Profile Dropdown */}
        {data.isProfileOpen && (
          <div className="absolute right-6 top-20 w-64 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 animate-slide-down">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-500 rounded-3xl flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-lg">
                {data.user.avatar}
              </div>
              <h3 className="font-bold">{data.user.name}</h3>
              <p className="text-sm text-gray-400">Maman de {data.user.babyName}</p>
            </div>
            
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300">
                <User className="w-5 h-5 " />
                <span className="text-gray-700">Profil</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300">
                <Settings className="w-5 h-5 " />
                <span className="text-gray-700">Paramètres</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 rounded-2xl transition-all duration-300">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-red-600">Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// ✅ Header Variant 2: Plus compact et minimaliste
const HeaderVariant2 = ({ data }: { data: any }) => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary-600 to-primary-700 shadow-xl">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Title compact */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">{data.currentPage}</h1>
          </div>

          {/* Right compact */}
          <div className="flex items-center space-x-2">
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-all duration-300">
              <Bell className="w-5 h-5 text-white" />
              {data.notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{data.notificationCount}</span>
                </div>
              )}
            </button>

            <button className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
              {data.user.avatar}
            </button>

            <button className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300">
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

// ✅ Header Variant 3: Avec navigation horizontale
const HeaderVariant3 = ({ data }: { data: any }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Logo + User info */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl flex items-center justify-center shadow-lg">
              <Baby className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">PistacheTracker Pro</h1>
              <p className="text-sm text-gray-400">{data.user.babyName} • {data.user.babyAge}</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-3">
            <button className="relative p-2 hover:bg-primary-50 rounded-xl transition-all duration-300">
              <Bell className="w-6 h-6 " />
              {data.notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-xs font-bold text-white">{data.notificationCount}</span>
                </div>
              )}
            </button>

            <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg">
              {data.user.avatar}
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
          {data.pages.map((page: any) => {
            const Icon = page.icon
            const isActive = page.name === data.currentPage
            return (
              <button
                key={page.id}
                onClick={() => data.setCurrentPage(page.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 flex-1 justify-center ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-primary-600 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{page.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}

// ✅ Header Variant 4: Style iOS moderne
const HeaderVariant4 = ({ data }: { data: any }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl flex items-center justify-center shadow-xl">
              <Baby className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.currentPage}</h1>
              <p className="text-sm text-primary-600 font-medium">{data.user.babyName}</p>
            </div>
          </div>

          {/* Right: Actions in pills */}
          <div className="flex items-center space-x-2">
            <div className="bg-gray-100 rounded-full p-2 flex items-center space-x-2">
              <button className="relative p-2 hover:bg-white rounded-full transition-all duration-300">
                <Bell className="w-5 h-5 " />
                {data.notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{data.notificationCount}</span>
                  </div>
                )}
              </button>

              <button className="w-9 h-9 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white shadow-lg">
                {data.user.avatar}
              </button>

              <button className="p-2 hover:bg-white rounded-full transition-all duration-300">
                <Menu className="w-5 h-5 " />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ✅ Composant principal avec toutes les variantes
export default function StickyHeaderMockups() {
  const data = useAppData()
  const [selectedVariant, setSelectedVariant] = useState(1)

  const variants = [
    { id: 1, name: 'Glassmorphism', component: HeaderVariant1 },
    { id: 2, name: 'Compact', component: HeaderVariant2 },
    { id: 3, name: 'Avec Navigation', component: HeaderVariant3 },
    { id: 4, name: 'Style iOS', component: HeaderVariant4 }
  ]

  const SelectedComponent = variants.find(v => v.id === selectedVariant)?.component || HeaderVariant1

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-400 to-white">
      {/* Variant Selector */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-2 shadow-2xl border border-white/20">
          <div className="flex space-x-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  selectedVariant === variant.id
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Header */}
      <SelectedComponent data={data} />

      {/* Demo Content */}
      <div className="p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">
            Header Variant: {variants.find(v => v.id === selectedVariant)?.name}
          </h2>
          <p className="text-gray-600">
            Cliquez sur les boutons en bas pour voir les différentes variantes
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-bold mb-4">🎨 Design Features</h3>
            <ul className="space-y-3 ">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Glassmorphism moderne</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Sticky positioning</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Animations fluides</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Notifications avec badges</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Dropdown utilisateur</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-bold mb-4">⚡ Interactions</h3>
            <ul className="space-y-3 ">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Logo animé au hover</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Cloche de notifications</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Avatar utilisateur cliquable</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Menu burger responsive</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Navigation rapide (Variant 3)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Content simulation */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white/60 backdrop-blur-lg rounded-3xl p-8 shadow-lg border border-white/20">
              <h3 className="text-xl font-bold mb-4">Section de contenu {i}</h3>
              <p className="text-gray-600 mb-4">
                Cette section simule le contenu de votre application. Le header reste collé en haut lors du scroll.
              </p>
              <div className="bg-gradient-to-r from-primary-100 to-primary-200 rounded-2xl p-4">
                <p className="text-primary-800 dark:text-primary-200 font-medium">
                  Le header s'adapte parfaitement au design de votre BabyTracker avec le thème primary.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}