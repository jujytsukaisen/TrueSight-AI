const BASE_URL = 'http://localhost:8000'

export class ApiError extends Error {
  constructor(message, { isConnectionError = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.isConnectionError = isConnectionError
  }
}

/**
 * POST /analyze — { input_type: 'text' | 'url' | 'image', content: string }
 * Returns the AnalysisResult shape from SPEC.md.
 */
export async function analyzeContent({ inputType, content }) {
  let response
  try {
    response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_type: inputType, content }),
    })
  } catch {
    throw new ApiError('connection', { isConnectionError: true })
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new ApiError(detail)
  }

  return response.json()
}

/**
 * GET /sources?topic=&language= — returns matching official_sources.json entries.
 * Used to enrich the AI's suggested_sources categories with real, vetted links.
 */
export async function fetchSources({ topic, language } = {}) {
  const params = new URLSearchParams()
  if (topic) params.set('topic', topic)
  if (language) params.set('language', language)
  try {
    const response = await fetch(`${BASE_URL}/sources?${params.toString()}`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}
