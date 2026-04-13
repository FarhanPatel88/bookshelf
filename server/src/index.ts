import 'dotenv/config';
import '@errio/node';
import express from 'express';
import cors from 'cors';
import { requestHandler, errorHandler } from '@errio/node';
import booksRouter from './routes/books.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(requestHandler());
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173'] }));

app.use('/api/books', booksRouter);

app.use(errorHandler());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
