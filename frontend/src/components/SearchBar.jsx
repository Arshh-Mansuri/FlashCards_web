// Controlled input for real-time client-side filtering. Filtering itself
// happens in App as the value changes — no extra requests, instant results.
export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search questions, answers or decks…"
        aria-label="Search flashcards"
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
