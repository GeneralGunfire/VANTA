import { PageHeader } from '../components/ui'

const FAQS = [
  {
    q: 'How do I record a sale or expense?',
    a: 'Go to Chat and type it the way you\'d say it out loud, e.g. "sold 20 loaves R400 cash" or "bought flour for R180". Vanta will show you what it understood before adding it.',
  },
  {
    q: 'What if Vanta gets something wrong?',
    a: 'Tap "Not quite" on the confirmation card and describe it again. Corrections you make are logged in Correction history and help Vanta improve for your business.',
  },
  {
    q: 'What does the flag next to a transaction mean?',
    a: 'It means Vanta wasn\'t fully confident about a category or amount — usually from an uploaded photo or file. Open the entry to confirm or fix it.',
  },
  {
    q: 'Can I upload a spreadsheet or photo instead of typing?',
    a: 'Excel/CSV upload is supported today. Photo upload (e.g. of a receipt or WhatsApp message) is planned but not available yet.',
  },
  {
    q: 'Do I need to register my business to use Vanta?',
    a: 'No. Vanta is built for informal, unregistered businesses too.',
  },
  {
    q: 'Is my data safe?',
    a: 'Your records are private to your account. Vanta never shares your ledger without your permission.',
  },
]

export default function Help() {
  return (
    <div className="page">
      <PageHeader title="Help" sub="Common questions about using Vanta." />
      <div>
        {FAQS.map((f) => (
          <details className="help-item" key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
