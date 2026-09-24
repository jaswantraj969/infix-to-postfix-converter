import { useCallback, useMemo, useRef, useState } from 'react'
import { convert, EVALUATION_STATUS } from './compiler/index.js'
import { useHistory } from './hooks/useHistory.js'
import { useToast } from './hooks/useToast.js'

import AppHeader from './components/AppHeader.jsx'
import ExpressionInput from './components/ExpressionInput.jsx'
import ExampleChips from './components/ExampleChips.jsx'
import VariablePanel from './components/VariablePanel.jsx'
import ResultPanel from './components/ResultPanel.jsx'
import ConversionVisualizer from './components/ConversionVisualizer.jsx'
import EvaluationTrace from './components/EvaluationTrace.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import LearnSection from './components/LearnSection.jsx'
import Toast from './components/Toast.jsx'
import Icon from './components/Icon.jsx'
import './App.css'

export default function App() {
  const [expression, setExpression] = useState('')
  // The expression that was actually submitted - conversion results derive from
  // this, never from what is currently being typed.
  const [submitted, setSubmitted] = useState(null)
  const [variables, setVariables] = useState({})

  const history = useHistory()
  const { toast, show, dismiss } = useToast()
  const resultRef = useRef(null)

  /**
   * The single call into the compiler. Recomputing on a variable change is
   * cheap and keeps the evaluation in step with the inputs without re-running
   * anything by hand.
   */
  const result = useMemo(
    () => (submitted === null ? null : convert(submitted, variables)),
    [submitted, variables],
  )

  const runConversion = useCallback(
    async (rawText, { save = true } = {}) => {
      const text = rawText.trim()
      setSubmitted(text)

      const outcome = convert(text, variables)
      if (!outcome.success || !save) return

      const stored = await history.save({
        infixExpression: outcome.infix,
        postfixExpression: outcome.postfix,
        result:
          outcome.evaluation.status === EVALUATION_STATUS.OK ? outcome.evaluation.formatted : null,
      })

      // The conversion is already on screen; only the saving failed.
      if (!stored.ok) {
        show('Conversion completed, but history could not be saved.', 'error')
      }
    },
    [variables, history, show],
  )

  const handleConvert = useCallback(() => runConversion(expression), [expression, runConversion])

  const handleSelectExample = useCallback(
    (text) => {
      setExpression(text)
      runConversion(text)
    },
    [runConversion],
  )

  const handleClear = useCallback(() => {
    setExpression('')
    setSubmitted(null)
    setVariables({})
  }, [])

  const handleVariableChange = useCallback((name, value) => {
    setVariables((current) => ({ ...current, [name]: value }))
  }, [])

  const handleOpenHistoryItem = useCallback(
    (item) => {
      setExpression(item.infixExpression)
      // Reopening an entry must not create a duplicate entry.
      runConversion(item.infixExpression, { save: false })
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [runConversion],
  )

  const handleDeleteHistoryItem = useCallback(
    async (id) => {
      const outcome = await history.remove(id)
      show(outcome.ok ? 'History entry deleted.' : outcome.message, outcome.ok ? 'success' : 'error')
    },
    [history, show],
  )

  const handleClearHistory = useCallback(async () => {
    const outcome = await history.clear()
    show(outcome.ok ? 'History cleared.' : outcome.message, outcome.ok ? 'success' : 'error')
  }, [history, show])

  const identifiers = result?.success ? result.identifiers : []

  return (
    <div className="app">
      <AppHeader backendStatus={history.status} />

      <main className="app-main" id="main">
        <div className="workspace">
          <div className="workspace-column">
            <ExpressionInput
              value={expression}
              onChange={setExpression}
              onConvert={handleConvert}
              onClear={handleClear}
              error={result?.success === false ? result.error : null}
              hasResult={Boolean(result?.success)}
            />
          </div>

          <div className="workspace-column" ref={resultRef}>
            <ResultPanel result={result} />
            <VariablePanel
              identifiers={identifiers}
              values={variables}
              onChange={handleVariableChange}
              onClear={() => setVariables({})}
            />
          </div>
        </div>

        <ExampleChips onSelect={handleSelectExample} activeExpression={submitted} />

        {result?.success && (
          <>
            <Section
              index="01"
              icon="stack"
              title="Conversion, step by step"
              subtitle="The shunting-yard algorithm running on your expression - one token at a time."
            >
              <ConversionVisualizer result={result} />
            </Section>

            {result.evaluation?.status === EVALUATION_STATUS.OK && (
              <Section
                index="02"
                icon="equals"
                title="Postfix evaluation"
                subtitle="A single stack and one left-to-right pass turn the postfix form into a value."
              >
                <EvaluationTrace result={result} />
              </Section>
            )}
          </>
        )}

        <Section
          index={result?.success ? '03' : '01'}
          icon="history"
          title="History"
          subtitle="Saved in a local SQLite database through the REST API."
        >
          <HistoryPanel
            items={history.items}
            status={history.status}
            busyId={history.busyId}
            onReload={history.load}
            onOpen={handleOpenHistoryItem}
            onDelete={handleDeleteHistoryItem}
            onClear={handleClearHistory}
          />
        </Section>

        <Section
          index={result?.success ? '04' : '02'}
          icon="book"
          title="How it works"
          subtitle="The concepts this project demonstrates."
        >
          <LearnSection />
        </Section>
      </main>

      <footer className="app-footer">
        <p>
          Infix &rarr; Postfix &middot; Compiler Construction project &middot; tokenizer, validator,
          shunting-yard conversion and stack evaluation implemented from scratch.
        </p>
      </footer>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  )
}

function Section({ index, icon, title, subtitle, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <div className="section-heading">
          <span className="section-index">{index}</span>
          <div>
            <h2 className="section-title">
              <Icon name={icon} size={16} className="section-icon" />
              {title}
            </h2>
            <p className="section-subtitle">{subtitle}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  )
}
