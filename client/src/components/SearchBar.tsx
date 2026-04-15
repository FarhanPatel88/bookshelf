import { useEffect, useState } from 'react';

interface Book {
  id: string;
  title: string;
  author: string;
  year?: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (!query) {
      setResults([]);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    fetch(`/api/books/search?q=${query}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setStatus('idle');
      });
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Search by title or author..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {status === 'loading' && (
        <p className="text-sm text-gray-500">Searching...</p>
      )}

      {status === 'idle' && results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((b) => (
            <li key={b.id} className="text-sm text-gray-700">
              <span className="font-medium">{b.title}</span>
              <span className="text-gray-500"> — {b.author}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
