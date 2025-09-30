'use client'
import { useEffect, useState } from 'react'

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
      className="px-3 py-1 border rounded-md text-sm"
      aria-pressed={isDark}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  )
}