import './TokenStream.css'

const TYPE_LABEL = {
  NUMBER: 'number',
  IDENTIFIER: 'identifier',
  OPERATOR: 'operator',
  LEFT_PAREN: 'bracket',
  RIGHT_PAREN: 'bracket',
}

/**
 * The token stream produced by the lexer, with the token currently being
 * processed highlighted. This is the visible proof that "100" is one token and
 * not three, and that "price" is one token and not five.
 */
export default function TokenStream({ tokens, currentIndex }) {
  return (
    <div className="token-stream">
      <div className="token-stream-head">
        <h3 className="panel-title">Token stream</h3>
        <span className="panel-meta">
          {tokens.length} token{tokens.length === 1 ? '' : 's'} from the lexer
        </span>
      </div>

      <ol className="token-list">
        {tokens.map((token, index) => {
          const state =
            index === currentIndex ? ' token-current' : index < currentIndex ? ' token-done' : ''
          return (
            <li key={index} className={'token-slot' + state}>
              <span className={'token token-' + token.type}>{token.text}</span>
              <span className="token-type">{TYPE_LABEL[token.type]}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
