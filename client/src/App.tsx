import { useState } from 'react';
import AddBook from './components/AddBook';
import BookList from './components/BookList';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Bookshelf</h1>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <AddBook onAdded={() => setRefreshKey((k) => k + 1)} />
        </div>

        <BookList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
