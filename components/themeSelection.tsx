"use client"

import { useTheme } from "next-themes"
import { Check } from "lucide-react"
import { useEffect, useState } from "react"

type ThemeOption = {
  value: "light" | "dark" | "system"
  label: string
}

const themeOptions: ThemeOption[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
]

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Interface Theme</h1>
          <p className="text-muted-foreground">Select your UI theme</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full">
          {themeOptions.map((option) => (
            <div key={option.value} className="flex-1 rounded-2xl overflow-hidden">
              <div className="bg-gray-200 dark:bg-gray-800 aspect-[4/3] animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Interface Theme</h1>
        <p className="text-muted-foreground">Select your UI theme</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {themeOptions.map((option) => (
          <div
            key={option.value}
            className={`relative flex-1 cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
              ${theme === option.value ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-300 hover:ring-blue-300'}`}
            onClick={() => setTheme(option.value)}
          >
            {theme === option.value && (
              <div className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <ThemePreview themeType={option.value} />
          </div>
        ))}
      </div>
    </div>
  )
}


type ThemePreviewProps = {
  themeType: "light" | "dark" | "system"
}

const ThemePreview = ({ themeType }: ThemePreviewProps) => {
  switch (themeType) {
    case "dark":
      return <DarkThemePreview />
    case "light":
      return <LightThemePreview />
    case "system":
      return <SystemThemePreview />
    default:
      return <SystemThemePreview />
  }
}

const DarkThemePreview = () => (
  <div className="bg-gray-900 p-4 aspect-[4/3]">
    <div className="flex gap-1 mb-4">
      <div className="w-3 h-3 rounded-full bg-red-500"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
    </div>
    <div className="flex gap-4 h-[calc(100%-24px)]">
      <div className="flex flex-col gap-2 w-1/3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-700 rounded"></div>
        ))}
      </div>
      <div className="w-2/3 bg-gray-800 rounded p-3 flex flex-col gap-2">
        <div className="h-4 w-2/3 bg-gray-700 rounded"></div>
        <div className="h-4 w-full bg-gray-700 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
        <div className="h-8 mt-auto w-full bg-gray-700 rounded relative">
          <div className="absolute right-2 top-2 w-4 h-4 bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
)

const LightThemePreview = () => (
  <div className="bg-gray-50 p-4 aspect-[4/3]">
    <div className="flex gap-1 mb-4">
      <div className="w-3 h-3 rounded-full bg-red-500"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
    </div>
    <div className="flex gap-4 h-[calc(100%-24px)]">
      <div className="flex flex-col gap-2 w-1/3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="w-2/3 bg-white rounded p-3 flex flex-col gap-2">
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-8 mt-auto w-full bg-gray-100 rounded"></div>
      </div>
    </div>
  </div>
)

const SystemThemePreview = () => (
  <div className="bg-gray-100 p-4 aspect-[4/3] dark:bg-gray-900">
    <div className="flex gap-1 mb-4">
      <div className="w-3 h-3 rounded-full bg-red-500"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
    </div>
    <div className="flex gap-4 h-[calc(100%-24px)]">
      <div className="flex flex-col gap-2 w-1/3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-300 rounded dark:bg-gray-700"></div>
        ))}
      </div>
      <div className="w-2/3 bg-gray-200 rounded p-3 flex flex-col gap-2 dark:bg-gray-800">
        <div className="h-4 w-2/3 bg-gray-300 rounded dark:bg-gray-700"></div>
        <div className="h-4 w-full bg-gray-300 rounded dark:bg-gray-700"></div>
        <div className="h-4 w-1/2 bg-gray-300 rounded dark:bg-gray-700"></div>
        <div className="h-8 mt-auto w-full bg-gray-300 rounded dark:bg-gray-700"></div>
      </div>
    </div>
  </div>
)