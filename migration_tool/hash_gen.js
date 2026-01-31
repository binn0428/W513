const crypto = require('crypto');
const passwords = ['w5131', 'w5132', 'w5133', '122232'];
passwords.forEach(p => {
    const hash = crypto.createHash('sha256').update(p).digest('hex');
    console.log(`${p}: ${hash}`);
});
