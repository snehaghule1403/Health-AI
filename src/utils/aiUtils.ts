import type { AIAnalysis, HealthRecord } from '../types';

const DISCLAIMER = 'This AI analysis is for informational purposes only and does not replace professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.';

// ─── DEMO AI REPORT ANALYZER ─────────────────────────────────────────────────

export function analyzeReport(record: HealthRecord): AIAnalysis {
  if (record.aiAnalysis) return record.aiAnalysis;

  const text = record.extractedText?.toLowerCase() ?? '';

  if (record.type === 'Blood Report' && text.includes('hemoglobin')) {
    return {
      summary: `Your blood report from ${record.date} has been analyzed. Most values fall within the healthy reference range, with a few values worth discussing with your doctor.`,
      keyFindings: [
        'Hemoglobin levels are within the normal range for your age and gender',
        'White blood cell count is normal, suggesting no signs of acute infection',
        'Platelet count is healthy',
        'MCH shows a minor reduction that may be diet-related',
      ],
      importantValues: [
        { name: 'Hemoglobin', value: '12.4 g/dL', status: 'normal' },
        { name: 'WBC Count', value: '7200 /mcL', status: 'normal' },
        { name: 'MCH', value: '26 pg', status: 'low' },
        { name: 'Platelets', value: '2.4 lakh/mcL', status: 'normal' },
      ],
      simpleExplanation: 'Your blood cells look generally healthy. The only minor variation is MCH — this is a measure of how much hemoglobin is inside each red blood cell. A slightly low value is often related to diet, especially iron or B12 intake.',
      questionsForDoctor: [
        'Is my iron intake adequate?',
        'Should I take any supplements?',
        'When should I repeat this test?',
        'Are my values appropriate for my age and gender?',
      ],
      disclaimer: DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  if (record.type === 'MRI') {
    return {
      summary: `MRI report from ${record.date} has been reviewed. The radiologist's findings have been summarized below in simpler language.`,
      keyFindings: [
        'No abnormal masses or lesions were identified',
        'Brain structure appears normal',
        'No signs of bleeding or fluid accumulation',
        'Overall impression is normal',
      ],
      importantValues: [
        { name: 'Brain Parenchyma', value: 'Normal', status: 'normal' },
        { name: 'Ventricles', value: 'Normal size', status: 'normal' },
        { name: 'Midline', value: 'No shift', status: 'normal' },
      ],
      simpleExplanation: 'This MRI was done to evaluate headaches. The images show that your brain looks structurally normal — no tumors, no bleeds, no swelling. Your doctor will correlate this with your symptoms.',
      questionsForDoctor: [
        'What is causing my headaches if the MRI is normal?',
        'Do I need any follow-up imaging?',
        'Should I track my headache patterns?',
        'Are there lifestyle changes that may help?',
      ],
      disclaimer: DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  if (record.type === 'Prescription') {
    return {
      summary: `Prescription from ${record.date} by ${record.doctor} analyzed. Medicines and instructions have been summarized.`,
      keyFindings: [
        'Vitamin D3 supplement prescribed — take once weekly',
        'Calcium supplement prescribed — twice daily with meals',
        'Iron + Folic Acid prescribed to address mild deficiency',
        'Follow-up in 3 months with repeat CBC recommended',
      ],
      importantValues: [
        { name: 'Vitamin D3', value: '60,000 IU weekly', status: 'info' },
        { name: 'Calcium', value: '500mg twice daily', status: 'info' },
        { name: 'Iron + Folic Acid', value: 'Once daily', status: 'info' },
      ],
      simpleExplanation: 'Your doctor has prescribed vitamins and minerals to address mild nutritional gaps. These are supportive supplements, not treatments for serious conditions. Consistency and proper timing (with meals) is important.',
      questionsForDoctor: [
        'How long do I need to take these supplements?',
        'Are there any side effects to watch for?',
        'Can I take all three at the same time?',
        'What foods can help alongside these medicines?',
      ],
      disclaimer: DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  // Generic fallback
  return {
    summary: `Report "${record.name}" from ${record.date} has been processed. Please review the extracted information with your doctor.`,
    keyFindings: [
      'Report has been digitized and stored securely',
      'Text has been extracted for reference',
      'Please discuss findings with your healthcare provider',
    ],
    importantValues: [
      { name: 'Report Type', value: record.type, status: 'info' },
      { name: 'Date', value: record.date, status: 'info' },
      { name: 'Ordered By', value: record.doctor || 'Not specified', status: 'info' },
    ],
    simpleExplanation: 'This report has been stored and extracted. Your doctor is the best person to explain what the specific findings mean for your health.',
    questionsForDoctor: [
      'Can you explain what this report shows?',
      'Are there any concerning findings?',
      'Do I need any follow-up tests?',
      'How does this compare to my previous reports?',
    ],
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

// ─── DEMO AI CHAT RESPONSES ──────────────────────────────────────────────────

const chatResponses: Record<string, string> = {
  hemoglobin: `**Hemoglobin** is a protein in your red blood cells that carries oxygen throughout your body.

**Normal ranges:**
- Women: 12.0–16.0 g/dL
- Men: 13.5–17.5 g/dL

Your latest reading was **12.4 g/dL**, which is within the normal range for a female. Maintaining good iron and B12 intake through diet helps keep hemoglobin healthy.

*This is educational information only. Discuss your specific values with your doctor.*`,

  blood_report: `Based on your latest **CBC Blood Report (Sep 2026)**:

✅ **Hemoglobin**: 12.4 g/dL — Normal
✅ **WBC Count**: 7200/mcL — Normal  
✅ **Platelets**: 2.4 lakh/mcL — Normal
⚠️ **MCH**: 26 pg — Slightly low

Overall, your blood report looks healthy. The MCH being slightly low may be related to diet. Your doctor has already prescribed Iron + Folic Acid to address this.

**Questions to ask your doctor:** Should I retest in 3 months? Is my iron intake sufficient?`,

  compare: `**Report Comparison — Lipid Profile:**

| Metric | Jul 2026 | Trend |
|--------|----------|-------|
| Total Cholesterol | 168 mg/dL | ✅ Normal |
| LDL | 95 mg/dL | ✅ Normal |
| HDL | 58 mg/dL | ✅ Normal |
| Triglycerides | 112 mg/dL | ✅ Normal |

Your lipid profile is excellent for your age. Keep up balanced diet and regular exercise habits.`,

  doctor: `**Preparing for your doctor visit?** Here are smart questions based on your current health data:

1. My MCH is slightly low — do I need additional iron testing?
2. How long should I continue my current vitamin supplements?
3. Are my CBC values improving with the supplements?
4. Is my blood pressure in a healthy range?
5. When should I schedule my next comprehensive check-up?

📋 Pro tip: Bring a list of your current medicines and any new symptoms you've noticed.`,

  bmi: `**BMI (Body Mass Index)** is calculated using your height and weight:

> BMI = Weight(kg) ÷ Height(m)²

Your current BMI: **20.9** (Height: 162cm, Weight: 55kg)

**BMI Categories:**
- Under 18.5 — Underweight
- 18.5–24.9 — ✅ Normal weight
- 25.0–29.9 — Overweight
- 30+ — Obese

Your BMI is in the **healthy normal range**. 

*BMI is a general screening tool and doesn't account for muscle mass, bone density, or body composition. Discuss with your doctor for personalized assessment.*`,

  fatigue: `**Fatigue** is a common symptom with many possible causes. Based on your health records, a few things worth discussing with your doctor:

**Relevant to your profile:**
- Mild MCH reduction (can contribute to tiredness)
- Vitamin D insufficiency (known to cause fatigue)
- Sleep average: 7 hours (generally adequate)

**General information (not a diagnosis):**
- Iron deficiency can cause fatigue
- Poor sleep quality affects energy
- Dehydration reduces energy levels

**When to seek immediate help:**
- Fatigue with chest pain or shortness of breath
- Extreme fatigue lasting more than 2 weeks
- Fatigue with unexplained weight loss

*Always consult your doctor if fatigue persists or worsens.*`,

  default: `I'm your **HealthAI Assistant**. I can help you understand:

- 📋 Your health reports and lab values
- 💊 Information about your medicines
- 📊 Your health trends and patterns
- ❓ Medical terms in simple language
- 🩺 Questions to ask your doctor

**Try asking:**
- "Explain my blood report"
- "What is hemoglobin?"
- "What is BMI?"
- "Questions to ask my doctor"
- "Tell me about fatigue"

⚠️ *I provide educational information only. I do not diagnose or prescribe. Always consult your healthcare provider.*`,
};

export function getChatResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('hemoglobin') || msg.includes('hgb')) return chatResponses.hemoglobin;
  if (msg.includes('blood report') || msg.includes('cbc') || msg.includes('blood count')) return chatResponses.blood_report;
  if (msg.includes('compare') || msg.includes('previous') || msg.includes('lipid')) return chatResponses.compare;
  if (msg.includes('doctor') || msg.includes('ask') || msg.includes('question')) return chatResponses.doctor;
  if (msg.includes('bmi') || msg.includes('body mass') || msg.includes('weight')) return chatResponses.bmi;
  if (msg.includes('fatigue') || msg.includes('tired') || msg.includes('exhausted')) return chatResponses.fatigue;
  if (msg.includes('hello') || msg.includes('hi ') || msg.includes('hey')) {
    return `Hello! 👋 I'm your HealthAI Assistant. How can I help you today?\n\n${chatResponses.default}`;
  }

  return chatResponses.default;
}

// ─── SYMPTOM CHECKER RESPONSE ─────────────────────────────────────────────────

export function getSymptomResponse(symptom: string, duration: string, severity: string): string {
  const s = symptom.toLowerCase();

  const general = `**Symptom Reported:** ${symptom}
**Duration:** ${duration} | **Severity:** ${severity}

---

⚠️ *This is general health information only — not a medical diagnosis.*

`;

  if (s.includes('fatigue') || s.includes('tired')) {
    return general + `**About Fatigue:**
Fatigue lasting more than a few days can have many causes including nutritional deficiencies, sleep issues, stress, or underlying conditions.

**Things to monitor:**
- Energy levels throughout the day
- Sleep quality and duration
- Whether it's improving or worsening

**Questions to ask your doctor:**
- Could my vitamin D or iron levels be contributing?
- Should I get blood tests done?
- Is there anything specific causing this?

**Seek prompt medical attention if:**
- Accompanied by chest pain or difficulty breathing
- You feel faint or lightheaded
- No improvement after 2 weeks`;
  }

  if (s.includes('headache') || s.includes('head pain')) {
    return general + `**About Headaches:**
Headaches are very common and usually not serious. They can be caused by tension, dehydration, screen time, stress, or other factors.

**Things to monitor:**
- Location and nature of the pain (throbbing, pressure, etc.)
- Triggers (stress, screen time, certain foods)
- Frequency and duration

**Questions to ask your doctor:**
- Should I get imaging done given my history?
- Are there specific triggers I should avoid?
- What pain management approaches are safe for me?

**Seek immediate medical attention if:**
- Sudden severe "thunderclap" headache
- Headache with fever, stiff neck, or vision changes
- Headache after a head injury`;
  }

  return general + `**General Monitoring Advice:**
Tracking your symptoms is a great first step in managing your health.

**Things to monitor:**
- How the symptom changes over time
- Any patterns or triggers you notice
- Impact on daily activities

**Questions to ask your doctor:**
- What could be causing these symptoms?
- Are any tests needed?
- What warning signs should prompt immediate care?

**Seek medical attention if:**
- Symptoms worsen or don't improve in a reasonable time
- You develop new or concerning symptoms
- You feel significantly unwell`;
}
