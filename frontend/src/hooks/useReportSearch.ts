import { useEffect, useState } from 'react'
import { searchReports, type SearchHit } from '../api/searchApi'
import { useDebounce } from './useDebounce'

const MIN_QUERY_LENGTH = 2

export function useReportSearch(query: string, token: string) {
  const debouncedQuery = useDebounce(query.trim(), 400)
  const isSearching = debouncedQuery.length >= MIN_QUERY_LENGTH

  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSearching) {
      setHits([])
      setError('')
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError('')

    searchReports(debouncedQuery, token, controller.signal)
      .then(setHits)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Search failed.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedQuery, isSearching, token])

  return { hits, loading, error, isSearching }
}