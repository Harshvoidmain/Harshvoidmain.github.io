const vars = {
    MYSQL_HOST: 'sql12.freesqldatabase.com',
    MYSQL_PORT: '3306',
    MYSQL_USER: 'sql12823670',
    MYSQL_PASSWORD: 'p8drE6VzYl',
    MYSQL_DATABASE: 'sql12823670'
};
const { execSync } = require('child_process');

console.log("Updating Vercel environment variables...");

for (const [k, v] of Object.entries(vars)) {
    console.log(`Processing ${k}...`);
    try {
        execSync(`npx vercel env rm ${k} production -y`, { stdio: 'ignore' });
        console.log(`Removed old ${k}`);
    } catch (e) {
        // Ignore error if it didn't exist
    }

    try {
        execSync(`npx vercel env add ${k} production`, { input: v, stdio: 'pipe' });
        console.log(`Successfully added ${k}`);
    } catch (e) {
        console.error(`Failed to add ${k}:`, e.message);
    }
}
console.log("Done.");
