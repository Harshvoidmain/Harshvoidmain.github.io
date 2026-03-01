const vars = {
    MYSQL_HOST: 'shortline.proxy.rlwy.net',
    MYSQL_PORT: '43104',
    MYSQL_USER: 'root',
    MYSQL_PASSWORD: 'kNIcPmbOizdhWFISEvyzraMAQgwhzoKE',
    MYSQL_DATABASE: 'railway'
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
