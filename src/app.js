import express from 'express';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes.js';

dotenv.config();
const app = express();

const path = dirname(fileURLToPath(import.meta.url));

app.set('views', join(path, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // gerir skjöl í /public aðgengileg í vafra

app.use('/', router);

app.use((req, res) => {
    res.status(404).render('404');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
