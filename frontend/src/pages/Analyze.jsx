import { useState, useRef } from 'react'
import { Link2, Type, Image as ImageIcon, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { analyzeContent, ApiError } from '../lib/api'
import ResultsPanel from '../components/ResultsPanel'

const TYPES = [
  { key: 'text', icon: Type, labelKey: 'analyze.typeText' },
  { key: 'url', icon: Link2, labelKey: 'analyze.typeUrl' },
  { key: 'image', icon: ImageIcon, labelKey: 'analyze.typeImage' },
]

export default function Analyze() {
  const { t } = useLanguage()
  const [inputType, setInputType] = useState('text')
  const [textValue, setTextValue] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [imageData, setImageData] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  const currentValue = inputType === 'text' ? textValue : inputType === 'url' ? urlValue : imageData

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageData(reader.result)
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!currentValue || !currentValue.trim()) {
      setStatus('error')
      setErrorMessage(t('analyze.errorEmpty'))
      return
    }
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await analyzeContent({ inputType, content: currentValue })
      setResult(data)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      if (err instanceof ApiError && err.isConnectionError) {
        setErrorMessage(t('analyze.errorConnection'))
      } else {
        setErrorMessage(err?.message || t('analyze.errorGeneric'))
      }
    }
  }

  function reset() {
    setStatus('idle')
    setResult(null)
    setErrorMessage('')
    setTextValue('')
    setUrlValue('')
    setImageData(null)
    setImagePreview(null)
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink text-balance">
        {t('analyze.title')}
      </h1>
      <p className="mt-3 text-ink/65 max-w-xl">{t('analyze.subtitle')}</p>

      {status === 'success' && result ? (
        <div className="mt-10">
          <ResultsPanel result={result} />
          <button
            onClick={reset}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/80 hover:border-ink/40 hover:text-ink transition-colors"
          >
            <RotateCcw size={15} />
            {t('analyze.tryAnother')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10">
          <div className="flex gap-2 mb-4">
            {TYPES.map(({ key, icon: Icon, labelKey }) => (
              <button
                type="button"
                key={key}
                onClick={() => setInputType(key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  inputType === key
                    ? 'bg-ink text-paper'
                    : 'bg-paper-raised text-ink/60 hover:text-ink border border-ink/10'
                }`}
              >
                <Icon size={14} />
                {t(labelKey)}
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-ink/15 bg-paper-raised p-2">
            {inputType === 'text' && (
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={t('analyze.placeholderText')}
                rows={8}
                className="w-full resize-none rounded-2xl bg-transparent p-4 text-ink placeholder:text-ink/35 focus:outline-none"
              />
            )}
            {inputType === 'url' && (
              <input
                type="text"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder={t('analyze.placeholderUrl')}
                className="w-full rounded-2xl bg-transparent p-4 text-ink placeholder:text-ink/35 focus:outline-none"
              />
            )}
            {inputType === 'image' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handleFile(e.dataTransfer.files?.[0])
                }}
                className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/20 p-6 text-center hover:border-signal/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="" className="max-h-40 rounded-xl" />
                    <span className="text-sm text-ink/60">{t('analyze.uploadChange')}</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={28} className="text-ink/30" />
                    <span className="text-sm text-ink/55">{t('analyze.uploadPrompt')}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {status === 'error' && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-alert-soft px-4 py-3 text-sm text-alert">
              <AlertCircle size={16} className="shrink-0" />
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-semibold text-paper hover:bg-signal-dark disabled:opacity-70 transition-colors"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('analyze.analyzing')}
              </>
            ) : (
              t('analyze.submit')
            )}
          </button>
        </form>
      )}
    </div>
  )
}
