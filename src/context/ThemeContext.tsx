'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize theme once on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(systemPrefersDark ? 'dark' : 'light')
    }
    setIsInitialized(true)
  }, [])

  // Apply theme changes and save to localStorage
  useEffect(() => {
    if (!isInitialized) return // Skip initial render

    const root = document.documentElement
    
    // Apply the theme class
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
    
    console.log('Applied theme:', theme)
    console.log('Saved to localStorage:', theme)
  }, [theme, isInitialized])

  const toggleTheme = () => {
    console.log('Toggling theme from:', theme, 'to:', theme === 'light' ? 'dark' : 'light')
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)