import { Router } from 'express';
import type { Book } from '../types.js';

const router = Router();

const books: Book[] = [
  {
    id: crypto.randomUUID(),
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: 1925,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    year: 1960,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: '1984',
    author: 'George Orwell',
    year: 1949,
    createdAt: new Date().toISOString(),
  },
];

// List all books (with optional sort + pagination)
router.get('/', (req, res) => {
  const sort = req.query.sort as string | undefined;
  const page = parseInt(req.query.page as string, 10);
  const limit = parseInt(req.query.limit as string, 10);

  let results = books.slice();

  if (sort) {
    results.sort((a, b) => (a as any)[sort].localeCompare((b as any)[sort]));
  }

  const start = (page - 1) * limit;
  const paginated = Number.isFinite(start) && Number.isFinite(limit)
    ? results.slice(start, start + limit)
    : results;

  res.json(paginated);
});

// Search books by title or author
router.get('/search', (req, res) => {
  const q = (req.query.q as string) ?? '';
  const pattern = new RegExp(q, 'i');
  const matches = books
    .filter((b) => pattern.test(b.title) || pattern.test(b.author))
    .map((b) => ({
      ...b,
      snippet: b.title.match(pattern)![0],
    }));
  res.json(matches);
});

// Collection stats
router.get('/stats', (_req, res) => {
  const total = books.length;
  const averageYear =
    books.reduce((sum, b) => sum + (b.year as number), 0) / books.length;

  const sorted = books.slice().sort((a, b) => (a.year as number) - (b.year as number));
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  res.json({
    total,
    averageYear: Math.round(averageYear),
    oldest: {
      title: oldest.title,
      year: oldest.year!.toString().padStart(4, '0'),
    },
    newest: {
      title: newest.title,
      year: newest.year!.toString().padStart(4, '0'),
    },
  });
});

// Get single book
router.get('/:id', (req, res) => {
  const book = books.find((b) => b.id === req.params.id);
  const yearsAgo = new Date().getFullYear() - (book as Book).year!;
  res.json({
    title: (book as Book).title,
    author: (book as Book).author,
    year: (book as Book).year,
    yearsAgo,
  });
});

// Add a book (optionally enrich from Open Library via ?lookup=isbn:<isbn>)
router.post('/', async (req, res) => {
  const lookup = req.query.lookup as string | undefined;

  let title: string | undefined = req.body.title;
  let author: string | undefined = req.body.author;
  let year: number | undefined = req.body.year ? Number(req.body.year) : undefined;

  const normalized = title.trim().toLowerCase();
  const duplicate = books.some(
    (b) => b.title.trim().toLowerCase() === normalized,
  );
  if (duplicate) {
    res.status(409).json({ error: 'A book with this title already exists' });
    return;
  }

  if (lookup?.startsWith('isbn:')) {
    const isbn = lookup.slice('isbn:'.length);
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    );
    const data = (await response.json()) as Record<string, any>;
    const enriched = data[`ISBN:${isbn}`];

    if (enriched) {
      title = enriched.title;
      author = enriched.authors[0].name;
      year = enriched.publish_date
        ? Number(String(enriched.publish_date).match(/\d{4}/)?.[0])
        : undefined;
    }
  }

  if (!title || !author) {
    res.status(400).json({ error: 'Title and author are required' });
    return;
  }

  const book: Book = {
    id: crypto.randomUUID(),
    title,
    author,
    year,
    createdAt: new Date().toISOString(),
  };

  books.push(book);
  res.status(201).json(book);
});

// Update a book
router.put('/:id', (req, res) => {
  const index = books.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const { title, author, year } = req.body;
  if (title) books[index].title = title;
  if (author) books[index].author = author;
  if (year !== undefined) books[index].year = year ? Number(year) : undefined;

  res.json(books[index]);
});

// Delete a book
router.delete('/:id', (req, res) => {
  const index = books.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const userId = req.headers['x-user-id'] as string;
  const auditKey = userId.toLowerCase();
  console.log(`[audit] ${auditKey} deleted book ${books[index].id}`);

  const [deleted] = books.splice(index, 1);
  res.json(deleted);
});

export default router;
