const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export type SearchHit = {
  report: {
    id: number
    title: string
    description: string | null
    report_type: string
    report_date: string
    agency_id: number
    uploaded_by: number
    agency_name: string | null
    uploader_name: string | null
    is_deleted: boolean
    original_filename: string | null
    stored_filename: string | null
    file_path: string | null
    content_type: string | null
    file_size: number | null
    created_at: string
    updated_at: string
  }
  score: number
  snippet: string | null
}

export async function searchReports(
  query: string,
  token: string,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/search/reports?q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` }, signal },
  )

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Session expired. Please sign in again.'
        : 'Search failed. Please try again.',
    )
  }

  const data: { results: SearchHit[] } = await response.json()
  return data.results
}