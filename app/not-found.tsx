import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold text-stone-900">Page not found</h1>
      <p className="mt-3 text-stone-700">The page you requested does not exist.</p>
      <Link
        href="/"
        className="mt-6 rounded border-2 border-stone-900 bg-amber-200 px-4 py-2 font-semibold text-stone-900"
      >
        Go to arena
      </Link>
    </div>
  )
}
