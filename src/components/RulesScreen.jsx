import Brand from './Brand'

const MENTI_QR = `${import.meta.env.BASE_URL}menti-qr-code.png`

const rules = (roundCount) => [
  ['Vote', 'Scan the QR code and vote on Menti. Keep the question to yourself!'],
  ['Buzz in', 'One player from each team buzzes in. The higher answer on the board wins control.'],
  ['Play', 'The team in control keeps guessing until the board is clear or they get 3 strikes.'],
  ['Steal', 'Three strikes? The other team gets one guess to steal all the round’s points.'],
  ['Win', `${roundCount} rounds. The team with the most points wins!`],
]

// Audience-facing "How to play" screen with the voting QR code, shown over the board.
export default function RulesScreen({ roundCount, onClose }) {
  return (
    <div className="rules" role="dialog" aria-label="How to play" onClick={onClose}>
      <div className="rules__stage">
        <Brand />
        <div className="rules__body">
          <section className="rules__card">
            <h2>How to play</h2>
            <ol className="rules__list">
              {rules(roundCount).map(([title, text], i) => (
                <li key={title}>
                  <span className="rules__num">{i + 1}</span>
                  <span>
                    <strong>{title}</strong>
                    {text}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <figure className="rules__qr">
            <div className="rules__qr-code">
              <img src={MENTI_QR} alt="QR code to vote on Menti" />
            </div>
            <figcaption>Scan to vote</figcaption>
          </figure>
        </div>
      </div>
    </div>
  )
}
