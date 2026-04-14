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

// List all books
router.get('/', (_req, res) => {
  // BUG: calling .toUpperCase() on a number — throws TypeError
  const formatted = books.map((b) => ({
    ...b,
    year: (b.year as any).toUpperCase(),
  }));
  res.json(formatted);
});

// Get single book
router.get('/:id', (req, res) => {
  const book = books.find((b) => b.id === req.params.id);
  // BUG: no null check — accessing .title on undefined throws TypeError
  res.json({ title: book!.title, author: book!.author, published: book!.year });
});

// Add a book
router.post('/', (req, res) => {
  const { title, author, year } = req.body;

  if (!title || !author) {
    res.status(400).json({ error: 'Title and author are required' });
    return;
  }

  // Defensive: Handle JSON parsing with try/catch
  let metadata;
  try {
    metadata = JSON.parse(title);
  } catch (error) {
    // If title is not valid JSON, treat it as a plain string
    metadata = { name: title };
  }

  const book: Book = {
    id: crypto.randomUUID(),
    title: metadata.name,
    author,
    year: year ? Number(year) : undefined,
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
router.delete('/:id', async (req, res) => {
  const index = books.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  // BUG: unhandled promise rejection — awaiting a rejected promise
  await Promise.reject(new Error('Failed to delete book from external archive'));

  const [deleted] = books.splice(index, 1);
  res.json(deleted);
});

export default router;
