// Example analyses run during development, shown on the News page so the
// demo has something to display even before a visitor submits their own
// content. These match the AnalysisResult schema exactly (see SPEC.md) —
// they are not live data, and the UI doesn't claim they are.

export const exampleAnalyses = [
  {
    original:
      'BREAKING: Global catastrophe will destroy the economy within HOURS! Banks are HIDING the truth from you!!',
    result: {
      content_type: 'news',
      language: 'en',
      trust_score: 18,
      score_reasoning:
        'Extreme, unsupported urgency language combined with an unfounded conspiracy claim about banks, with no specific verifiable claim or source given.',
      indicators: [
        {
          category: 'sensationalism',
          description: "'Global catastrophe' and 'destroy the economy' with no specific event named",
          severity: 'high',
        },
        {
          category: 'emotional_manipulation',
          description:
            "'Banks are HIDING the truth from you' implies a conspiracy without evidence, designed to provoke distrust and fear",
          severity: 'high',
        },
        {
          category: 'pressure_tactics',
          description: "'within HOURS' creates false urgency with no basis given",
          severity: 'medium',
        },
      ],
      neutral_rephrasing:
        'The post claims a major economic event is imminent and that banks are withholding information, but provides no specific event, source, or evidence.',
      suggested_sources: [
        'national central bank or finance ministry',
        'a fact-checking organization',
        'established financial news outlets',
      ],
      literacy_tip:
        "When a post claims institutions are 'hiding the truth' with no named source, that's a claim to verify independently before reacting, not a reason to trust the poster more.",
    },
  },
  {
    original:
      '🎁 مبروك! ربحت جائزة 1000 دولار! اضغط الرابط الآن قبل انتهاء العرض خلال 30 دقيقة وأدخل معلوماتك البنكية للاستلام الفوري',
    result: {
      content_type: 'advertisement',
      language: 'ar',
      trust_score: 8,
      score_reasoning:
        'الإعلان يستخدم وعدًا غير واقعي بجائزة نقدية، وضغطًا زمنيًا حادًا، ويطلب معلومات مصرفية حساسة — مؤشرات احتيال واضحة.',
      indicators: [
        {
          category: 'fraud_indicators',
          description: 'يطلب معلومات مصرفية مباشرة مقابل جائزة مزعومة',
          severity: 'high',
        },
        {
          category: 'unrealistic_promises',
          description: 'وعد بجائزة 1000 دولار دون أي شرح لكيفية الفوز',
          severity: 'high',
        },
        {
          category: 'pressure_tactics',
          description: 'مهلة 30 دقيقة فقط لدفع المستخدم لاتخاذ قرار سريع',
          severity: 'high',
        },
      ],
      neutral_rephrasing:
        'إعلان يدعي منح جائزة نقدية مقابل تقديم معلومات مصرفية خلال وقت محدود، دون تفاصيل واضحة عن الجهة المسؤولة.',
      suggested_sources: ['جهة حماية المستهلك الرسمية', 'منصة تحقق موثوقة'],
      literacy_tip:
        "أي عرض يطلب معلومات مصرفية مقابل جائزة 'مجانية' يستحق حذرًا شديدًا، خاصة إذا كان هناك ضغط زمني.",
    },
  },
  {
    original:
      'The Ministry of Health announced that flu vaccinations are now available at public clinics nationwide, with scheduling details posted on its official website.',
    result: {
      content_type: 'news',
      language: 'en',
      trust_score: 91,
      score_reasoning:
        'Neutral, factual language with no urgency or exaggeration, referencing an official government announcement.',
      indicators: [],
      neutral_rephrasing:
        'The Ministry of Health announced that flu vaccinations are available at public clinics, with details on its official website.',
      suggested_sources: ['national Ministry of Health'],
      literacy_tip:
        "Official announcements with clear sourcing are generally low-risk, but it's still good practice to confirm details on the official site before acting.",
    },
  },
]
