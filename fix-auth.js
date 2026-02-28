const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('route.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./app/api');
let replacedFiles = [];

const replacement = `// Get user using our robust server-side auth utility
    const { getAuthUser } = await import("@/app/lib/auth-server");
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Polyfill authData to avoid breaking existing downstream code
    const authData = { success: true, user };`;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    if (content.includes('/api/auth/me') && content.includes('authData.user')) {
        let hasReplaced = false;

        // We'll replace all occurrences in the file
        while (content.includes('const authResponse = await fetch') && content.includes('/api/auth/me')) {
            const fetchIndex = content.indexOf('const authResponse = await fetch');
            // Look for the comment just before it, if it's close
            const commentIndex = content.lastIndexOf('// Get user info from auth system', fetchIndex);
            const realStart = (commentIndex !== -1 && fetchIndex - commentIndex < 50) ? commentIndex : fetchIndex;

            const userUnauthStr = '!authData.user';
            const ifUserUnauthIndex = content.indexOf(userUnauthStr, realStart);
            if (ifUserUnauthIndex === -1) {
                console.log('Could not find !authData.user in ' + file);
                break;
            }

            const statusIndex = content.indexOf('status: 401', ifUserUnauthIndex);
            if (statusIndex === -1) {
                console.log('Could not find status: 401 in ' + file);
                break;
            }

            const endOfParen = content.indexOf(');', statusIndex);
            if (endOfParen === -1) break;

            const endOfBlock = content.indexOf('}', endOfParen) + 1;

            if (endOfBlock > realStart) {
                content = content.slice(0, realStart) + replacement + content.slice(endOfBlock);
                hasReplaced = true;
            } else {
                break;
            }
        }

        if (hasReplaced) {
            fs.writeFileSync(file, content, 'utf8');
            replacedFiles.push(file);
        }
    }
}

console.log('Replaced in ' + replacedFiles.length + ' files');
if (replacedFiles.length > 0) {
    console.log(replacedFiles.join('\\n'));
}
