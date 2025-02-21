import fs from 'fs/promises';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use env variable for security
});

async function loadCategories() {
    const data = JSON.parse(await fs.readFile('data/index.json', 'utf-8'));
    for (const category of data.categories) {
        await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [category]);
    }
}

async function loadQuestionsAndAnswers() {
    const files = ['html.json', 'css.json', 'js.json'];

    for (const file of files) {
        const data = JSON.parse(await fs.readFile(`data/${file}`, 'utf-8'));
        const categoryResult = await pool.query('SELECT id FROM categories WHERE name = $1', [data.category]);

        if (categoryResult.rowCount === 0) continue;
        const categoryId = categoryResult.rows[0].id;

        for (const q of data.questions) {
            if (!q.question || !q.answers || q.answers.length < 2) continue; // Filter corrupt data
            const questionResult = await pool.query(
                'INSERT INTO questions (category_id, text) VALUES ($1, $2) RETURNING id',
                [categoryId, q.question]
            );
            const questionId = questionResult.rows[0].id;

            for (const ans of q.answers) {
                if (!ans.text) continue; // Skip bad answers
                await pool.query(
                    'INSERT INTO answers (question_id, text, is_correct) VALUES ($1, $2, $3)',
                    [questionId, ans.text, ans.correct || false]
                );
            }
        }
    }
}

async function main() {
    await loadCategories();
    await loadQuestionsAndAnswers();
    console.log('Database seeded successfully');
    await pool.end();
}

main().catch(console.error);
