import prisma from '../config/db.js';
import { generateShortCode } from '../utils/generateShortCode.js';

/**
 * Generates a collision-resistant unique short code.
 * Re-rolls up to 5 times if a collision is found in the database.
 * @returns {Promise<string>} The unique short code.
 */
export async function generateUniqueShortCode() {
    let shortCode = generateShortCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
        const existing = await prisma.url.findUnique({
            where: { shortCode }
        });
        if (!existing) {
            isUnique = true;
        } else {
            shortCode = generateShortCode();
            attempts++;
        }
    }

    if (!isUnique) {
        throw new Error("Could not generate a unique short code. Please try again.");
    }

    return shortCode;
}
