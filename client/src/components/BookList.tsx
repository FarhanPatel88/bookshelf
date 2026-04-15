import { useEffect, useState } from 'react';

interface Book {
  id: string;
  title: string;
  author: string;
  year?: number;
  createdAt: string;
}

interface BookListProps {
  refreshKey: number;
}

export default function BookList({ refreshKey }: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [refreshKey]);

  async function fetchBooks() {
    setLoading(true);
    const res = await fetch('/api/books');
    const data = await res.json();
    setBooks(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    await fetch(`/api/books/${id}`, { method: 'DELETE' });
    fetchBooks();
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading books...</p>;
  }

  if (books.length === 0) {
    return <p className="text-sm text-gray-500">No books yet. Add one above!</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-800">
        Your Books ({books.length})
      </h2>

      <div className="flex flex-col gap-2">
        {books.map((book) => (
          <div
            key={book.id}
            className="flex items-center justify-between rounded border border-gray-200 bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-gray-900">{book.title}</p>
              <p className="text-sm text-gray-500">
                {book.author}
                {book.year && <span> &middot; {book.year}</span>}
              </p>
            </div>
            <button
              onClick={() => handleDelete(book.id)}
              className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
