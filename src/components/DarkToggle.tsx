'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react';

export default function DarkToggle () {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.theme === 'dark' : false
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.theme = isDark ? 'dark' : 'light'
  }, [isDark])


  return (
    <button
      onClick={() => setIsDark(v => !v)}
      className="p-2 border border-gray-300 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}