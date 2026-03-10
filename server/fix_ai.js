const fs = require('fs');
let c = fs.readFileSync('controllers/aiController.js', 'utf8');

// Remove the model guard lines 237-239
const lines = c.split('\n');
const filtered = lines.filter((line, i) => {
    const trimmed = line.trim();
    if (trimmed === 'if (!model) {') return false;
    if (trimmed === 'return res.status(503).json({ message: "AI Service Unavailable" });') return false;
    if (trimmed === '}' && lines[i-1] && lines[i-1].trim() === 'return res.status(503).json({ message: "AI Service Unavailable" });') return false;
    return true;
});
fs.writeFileSync('controllers/aiController.js', filtered.join('\n'));
console.log('Done. Removed model guard.');
