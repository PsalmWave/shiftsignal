import { useEffect, useState } from 'react'

/** SSR/jsdom-safe media query hook. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const list = window.matchMedia(query)
    const sync = () => setMatches(list.matches)
    sync()

    // A stale `true` here would leave the sidebar `inert` on desktop, so a
    // window resize listener backs up the media query listener.
    window.addEventListener('resize', sync)

    if (list.addEventListener) {
      list.addEventListener('change', sync)
      return () => {
        list.removeEventListener('change', sync)
        window.removeEventListener('resize', sync)
      }
    }
    // Safari < 14
    list.addListener(sync)
    return () => {
      list.removeListener(sync)
      window.removeEventListener('resize', sync)
    }
  }, [query])

  return matches
}

export function useIsCompact(): boolean {
  return useMediaQuery('(max-width: 1023px)')
}
