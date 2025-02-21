import express from 'express';
import { getDatabase } from './lib/db.client.js';
import { environment } from './lib/environment.js';
import { logger } from './lib/logger.js';
import { body, validationResult } from 'express-validator';

export const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categoryResult = await getDatabase()?.query('SELECT * FROM categories');
    const categories = categoryResult?.rows ?? [];
    res.render('index', { title: 'Spurningaleikur', categories });
  } catch (e) {
    logger.error('Database query error: ' + e);
    res.status(500).send('Villa við að sækja flokk');
  }
});

router.get('/:category', async (req, res) => {
  // TEMP EKKI READY FYRIR PRODUCTION
  try {
    const categoryName = req.params.category;
    const categoryResult = await getDatabase()?.query('SELECT id from categories WHERE name = $1', [categoryName]);
    
    if (!categoryResult?.rows.length) {
      return res.status(404).send("Flokkur ekki fundinn");
    }
    const categoryId = categoryResult.rows[0].id;
    const questionResult = await getDatabase()?.query('SELECT * FROM questions WHERE category_id = $1', [categoryId]);
    const answerResult = await getDatabase()?.query('SELECT * FROM answers');
  
    const questions = questionResult?.rows ?? [];
    const answers = answerResult?.rows ?? [];
    
    res.render('category', { categoryName, questions, answers });
  } catch(e) {
    logger.error('Database query error: ' + e);
    res.status(500).send('Villa við að sækja spurningar og svör');
  }
});

router.get('/form', (req, res) => {
  res.render('form', { title: 'Búa til spurningu' });
});

router.post('/form', [ 
  body('question')
    .trim()
    .isLength({ min: 10, max: 255})
    .withMessage('Spurning verður að vera á bilinu 10-255 stafir að lengd'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Flokkur verður að vera til'),
  body('answers')
    .isArray({ min: 2, max: 5 })
    .withMessage('Spurning þarf að hafa 2-5 svarmöguleika'),
  body('correctAnswer')
    .notEmpty()
    .withMessage('Eitt svar verður að vera valið sem rétt')
  ], async (req, res) => {

  const villur = validationResult(req);
  if (!villur.isEmpty()) {
    return res.status(400).json({ errors: villur.array() });
  }

  const { category, question, answers, correctAnswer } = req.body;
  const db = getDatabase();

  try {
    const env = environment(process.env, logger);
    if (!env) {
      process.exit(1);
    }
    
    const result = await db?.query('INSERT INTO categories (name) VALUES ($1)');

    res.render('form-created', { title: 'Flokkur búinn til' });
  } catch (e) {
    logger.error('Database query error: ' + e);
    res.status(500).send('Villa við að búa til flokk');
  }
});