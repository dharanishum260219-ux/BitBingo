"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold text-stone-900">Something went wrong</h1>
      <p className="mt-3 text-stone-700">The page failed to load. Try again, or return to the home page.</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded border-2 border-stone-900 bg-amber-200 px-4 py-2 font-semibold text-stone-900"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded border-2 border-stone-900 bg-white px-4 py-2 font-semibold text-stone-900"
        >
          Back home
        </Link>
      </div>
    </div>
  )
}
