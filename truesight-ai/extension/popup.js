const API_BASE = 'http://localhost:8000'
const MAX_PAGE_TEXT = 8000

const STRINGS = {
  en: {
    dir: 'ltr',
    langToggle: 'العربية',
    analyzePage: 'Analyze this page',
    or: 'or paste content',
    typeText: 'Text',
    typeUrl: 'Link',
    placeholderText: 'Paste an article, ad, or post…',
    placeholderUrl: 'https://…',
    submit: 'Analyze',
    analyzing: 'Reading the content closely…',
    tryAnother: 'Analyze something else',
    errorEmpty: 'Add some content first.',
    errorConnection: "Can't reach the backend at localhost:8000. Is it running?",
    errorGeneric: 'Something went wrong reaching the analysis engine.',
    trustScore: 'Trust Score',
    bandHigh: 'Low risk',
    bandMid: 'Caution',
    bandLow: 'High risk',
    indicatorsTitle: 'What was detected',
    indicatorsEmpty: 'No manipulation techniques detected.',
    severityLow: 'Low',
    severityMedium: 'Medium',
    severityHigh: 'High',
    neutralTitle: 'Neutral rewrite',
    sourcesTitle: 'Check against',
    tipTitle: 'Literacy tip',
    contentTypes: { news: 'News', advertisement: 'Advertisement', social_post: 'Social post', other: 'Content' },
  },
  ar: {
    dir: 'rtl',
    langToggle: 'English',
    analyzePage: 'حلّل هذه الصفحة',
    or: 'أو الصق محتوى',
    typeText: 'نص',
    typeUrl: 'رابط',
    placeholderText: 'الصق نص المقال أو الإعلان أو المنشور هنا…',
    placeholderUrl: 'https://…',
    submit: 'حلّل',
    analyzing: 'جارٍ قراءة المحتوى بعناية…',
    tryAnother: 'حلّل محتوى آخر',
    errorEmpty: 'أضف محتوى أولاً.',
    errorConnection: 'تعذّر الوصول إلى الخادم على localhost:8000. هل هو يعمل؟',
    errorGeneric: 'حدث خطأ أثناء الوصول إلى محرك التحليل.',
    trustScore: 'درجة الثقة',
    bandHigh: 'مخاطر منخفضة',
    bandMid: 'تحذير',
    bandLow: 'مخاطر عالية',
    indicatorsTitle: 'ما الذي اكتُشف',
    indicatorsEmpty: 'لم تُكتشف أساليب تلاعب في هذا المحتوى.',
    severityLow: 'منخفضة',
    severityMedium: 'متوسطة',
    severityHigh: 'عالية',
    neutralTitle: 'إعادة الصياغة المحايدة',
    sourcesTitle: 'تحقّق عبر',
    tipTitle: 'نصيحة توعوية',
    contentTypes: { news: 'خبر', advertisement: 'إعلان', social_post: 'منشور', other: 'محتوى' },
  },
}

const state = {
  language: 'en',
  inputType: 'text',
}

const el = {
  langToggle: document.getElementById('lang-toggle'),
  viewInput: document.getElementById('view-input'),
  viewLoading: document.getElementById('view-loading'),
  viewResults: document.getElementById('view-results'),
  analyzePageBtn: document.getElementById('analyze-page-btn'),
  typeBtns: document.querySelectorAll('.type-btn'),
  contentInput: document.getElementById('content-input'),
  errorBox: document.getElementById('error-box'),
  submitBtn: document.getElementById('submit-btn'),
  resetBtn: document.getElementById('reset-btn'),
  resultsMount: document.getElementById('results-mount'),
}

function t(key) {
  return STRINGS[state.language][key]
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str ?? ''
  return div.innerHTML
}

function applyLanguage() {
  document.body.dir = t('dir')
  el.langToggle.textContent = t('langToggle')
  el.analyzePageBtn.querySelector('span').textContent = t('analyzePage')
  document.querySelector('.divider span').textContent = t('or')
  el.typeBtns.forEach((btn) => {
    btn.textContent = btn.dataset.type === 'text' ? t('typeText') : t('typeUrl')
  })
  el.contentInput.placeholder = state.inputType === 'text' ? t('placeholderText') : t('placeholderUrl')
  el.submitBtn.textContent = t('submit')
  el.resetBtn.textContent = t('tryAnother')
}

el.langToggle.addEventListener('click', () => {
  state.language = state.language === 'en' ? 'ar' : 'en'
  applyLanguage()
})

el.typeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    state.inputType = btn.dataset.type
    el.typeBtns.forEach((b) => b.classList.toggle('active', b === btn))
    el.contentInput.placeholder = state.inputType === 'text' ? t('placeholderText') : t('placeholderUrl')
  })
})

function showView(name) {
  el.viewInput.classList.toggle('hidden', name !== 'input')
  el.viewLoading.classList.toggle('hidden', name !== 'loading')
  el.viewResults.classList.toggle('hidden', name !== 'results')
}

function showError(message) {
  el.errorBox.textContent = message
  el.errorBox.classList.remove('hidden')
}

function clearError() {
  el.errorBox.classList.add('hidden')
  el.errorBox.textContent = ''
}

async function callAnalyze(inputType, content) {
  let response
  try {
    response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_type: inputType, content }),
    })
  } catch {
    throw { connection: true }
  }
  if (!response.ok) {
    let detail = t('errorGeneric')
    try {
      const body = await response.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : t('errorGeneric')
    } catch {
      /* keep generic message */
    }
    throw { message: detail }
  }
  return response.json()
}

function getBand(score) {
  if (score >= 70) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

const BAND_VARS = {
  high: { bg: 'rgba(31,111,107,0.12)', bar: 'var(--signal)', label: 'var(--signal-dark)' },
  mid: { bg: 'rgba(216,154,75,0.16)', bar: 'var(--amber)', label: 'var(--ink)' },
  low: { bg: 'rgba(193,68,61,0.12)', bar: 'var(--alert)', label: 'var(--alert)' },
}

// Deterministic bars so the same score always renders the same reading —
// mirrors src/lib/trust.js on the website for visual consistency.
function buildBars(score, count) {
  let seed = Math.round(score * 97) + count
  function rand() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
  const risk = 1 - score / 100
  const baseline = 38 + score * 0.2
  const variance = 8 + risk * 62
  const bars = []
  let prev = baseline
  for (let i = 0; i < count; i++) {
    const jump = (rand() - 0.5) * 2 * variance
    const smoothing = 0.75 - risk * 0.55
    const next = prev * smoothing + (baseline + jump) * (1 - smoothing)
    const clamped = Math.max(6, Math.min(100, next))
    bars.push(clamped)
    prev = clamped
  }
  return bars
}

function signalStripHtml(score, height) {
  const band = getBand(score)
  const bars = buildBars(score, 18)
  const color = BAND_VARS[band].bar
  const inner = bars
    .map((h) => `<span style="height:${h}%;background:${color}"></span>`)
    .join('')
  return `<div class="signal-strip" style="height:${height}px">${inner}</div>`
}

const SEVERITY_BG = {
  low: 'background: rgba(24,32,40,0.06); color: rgba(24,32,40,0.7);',
  medium: 'background: var(--amber-soft); color: var(--ink);',
  high: 'background: var(--alert-soft); color: var(--alert);',
}

function categoryLabel(category) {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function renderResults(result) {
  const band = getBand(result.trust_score)
  const vars = BAND_VARS[band]
  const bandLabel = { high: t('bandHigh'), mid: t('bandMid'), low: t('bandLow') }[band]
  const contentTypeLabel = t('contentTypes')[result.content_type] || t('contentTypes').other

  const indicatorsHtml =
    result.indicators.length === 0
      ? `<p class="empty-indicators">${escapeHtml(t('indicatorsEmpty'))}</p>`
      : result.indicators
          .map(
            (ind) => `
        <div class="indicator-card">
          <div class="indicator-top">
            <span class="indicator-category">${escapeHtml(categoryLabel(ind.category))}</span>
            <span class="severity-badge" style="${SEVERITY_BG[ind.severity]}">${escapeHtml(
              { low: t('severityLow'), medium: t('severityMedium'), high: t('severityHigh') }[ind.severity]
            )}</span>
          </div>
          <p class="indicator-desc">${escapeHtml(ind.description)}</p>
        </div>`
          )
          .join('')

  const sourcesHtml = result.suggested_sources.map((s) => `<li>${escapeHtml(s)}</li>`).join('')

  el.resultsMount.innerHTML = `
    <div class="score-card" style="background:${vars.bg}">
      <span class="content-type">${escapeHtml(contentTypeLabel)}</span>
      <div class="score-row">
        <span class="score-number">${result.trust_score}</span>
        <span class="score-band" style="color:${vars.label}">${escapeHtml(bandLabel)}</span>
      </div>
      <p class="score-reasoning">${escapeHtml(result.score_reasoning)}</p>
      ${signalStripHtml(result.trust_score, 34)}
    </div>

    <h4 class="section-title">${escapeHtml(t('indicatorsTitle'))}</h4>
    ${indicatorsHtml}

    <div class="neutral-box">
      <h4 class="section-title">${escapeHtml(t('neutralTitle'))}</h4>
      <p>${escapeHtml(result.neutral_rephrasing)}</p>
    </div>

    <div class="info-box">
      <h4>${escapeHtml(t('sourcesTitle'))}</h4>
      <ul>${sourcesHtml}</ul>
    </div>
    <div class="info-box amber">
      <h4>${escapeHtml(t('tipTitle'))}</h4>
      <p>${escapeHtml(result.literacy_tip)}</p>
    </div>
  `
}

async function runAnalysis(inputType, content) {
  clearError()
  if (!content || !content.trim()) {
    showError(t('errorEmpty'))
    return
  }
  showView('loading')
  try {
    const result = await callAnalyze(inputType, content)
    renderResults(result)
    showView('results')
  } catch (err) {
    showView('input')
    showError(err.connection ? t('errorConnection') : err.message || t('errorGeneric'))
  }
}

el.submitBtn.addEventListener('click', () => {
  runAnalysis(state.inputType, el.contentInput.value)
})

el.analyzePageBtn.addEventListener('click', async () => {
  clearError()
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const [{ result: pageText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText,
    })
    const trimmed = (pageText || '').trim().slice(0, MAX_PAGE_TEXT)
    await runAnalysis('text', trimmed)
  } catch (err) {
    showError(t('errorGeneric'))
  }
})

el.resetBtn.addEventListener('click', () => {
  el.contentInput.value = ''
  clearError()
  showView('input')
})

applyLanguage()
