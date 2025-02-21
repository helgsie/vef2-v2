import { setupDbFromFiles } from '../setup.js';
import { beforeEach, describe, expect, jest, test } from "@jest/globals";


jest.mock('fs/promises', () => ({
    readFile: jest.fn(() => Promise.resolve(Buffer.from('drop.sql'))),
  }));

describe('setup', () => {
    describe('setupDbFromFiles', () => {
        let db, logger;

        beforeEach(() => {
            db = {
                query: jest.fn(() => Promise.resolve(true)), // Mock successful DB query
            };

            logger = {
                info: jest.fn(),
            };
        });

        test('should run setup successfully when all queries succeed', async () => {
            const result = await setupDbFromFiles(db, logger);

            expect(db.query).toHaveBeenCalledTimes(3);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DROP TABLE IF EXISTS'));
            expect(logger.info).toHaveBeenNthCalledWith(1, 'schema dropped');
            expect(logger.info).toHaveBeenNthCalledWith(2, 'schema created');
            expect(logger.info).toHaveBeenNthCalledWith(3, 'data inserted');
            expect(result).toBe(true);
        });

        test('should exit early if drop schema fails', async () => {
            db.query.mockResolvedValueOnce(false); // First query (drop) fails

            const result = await setupDbFromFiles(db, logger);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(logger.info).toHaveBeenCalledWith('schema not dropped, exiting');
            expect(result).toBe(false);
        });

        test('should exit early if create schema fails', async () => {
            db.query
            .mockResolvedValueOnce(true) // Drop schema succeeds
            .mockResolvedValueOnce(false); // Create schema fails

            const result = await setupDbFromFiles(db, logger);

            expect(db.query).toHaveBeenCalledTimes(2);
            expect(logger.info).toHaveBeenCalledWith('schema created');
            expect(logger.info).toHaveBeenCalledWith('schema not created');
            expect(result).toBe(false);
        });

        test('should exit early if insert data fails', async () => {
            db.query
            .mockResolvedValueOnce(true) // Drop schema succeeds
            .mockResolvedValueOnce(true) // Create schema succeeds
            .mockResolvedValueOnce(false); // Insert data fails

            const result = await setupDbFromFiles(db, logger);

            expect(db.query).toHaveBeenCalledTimes(3);
            expect(logger.info).toHaveBeenCalledWith('schema created');
            expect(logger.info).toHaveBeenCalledWith('data not inserted');
            expect(result).toBe(false);
        });
    });
});