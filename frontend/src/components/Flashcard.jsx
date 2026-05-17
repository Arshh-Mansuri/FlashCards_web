import { useState } from "react";

// A single study card. Click to flip; grading the answer ("Knew it" /
// "Forgot") records a learning-history entry and removes the card from
// the current session.
export default function Flashcard({ card, onDelete, onEdit, onGrade }) {
  const [flipped, setFlipped] = useState(false);
  const [leaving, setLeaving] = useState(false);

  function grade(result) {
    setLeaving(true);
    setTimeout(() => onGrade(card.id, result), 400);
  }

  function stop(e, fn) {
    e.stopPropagation();
    fn();
  }

  return (
    <div className={`card-wrapper${leaving ? " leaving" : ""}`}>
      <div
        className={`card${flipped ? " flipped" : ""}`}
        onClick={() => setFlipped(true)}
      >
        <div className="card-face card-front">
          <span className="deck-label">{card.deck}</span>
          <p className="card-text">{card.question}</p>
          <span className="hint">Click to reveal answer</span>
        </div>
        <div className="card-face card-back">
          <span className="deck-label">{card.deck}</span>
          <p className="card-text">{card.answer}</p>
          <div className="grade-row">
            <button
              className="btn grade forgot"
              onClick={(e) => stop(e, () => grade("unknown"))}
            >
              ✗ Forgot
            </button>
            <button
              className="btn grade knew"
              onClick={(e) => stop(e, () => grade("known"))}
            >
              ✓ Knew it
            </button>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button
          className="btn-icon edit"
          onClick={(e) => stop(e, () => onEdit(card))}
          title="Edit"
        >
          ✎
        </button>
        <button
          className="btn-icon delete"
          onClick={(e) => stop(e, () => onDelete(card.id))}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
