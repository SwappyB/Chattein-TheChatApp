const bcrypt = require('bcryptjs');
// Password hashing and verifying funtion

module.exports = function hashPWD() {
  return Object.freeze({
    hash,
    check,
  });

  async function hash(password) {
    let hashedPWD = await bcrypt.hash(password, 13);
    return hashedPWD;
  }

  async function check(password, hashedPWD) {
    let result = await bcrypt.compare(password, hashedPWD);
    return result;
  }
};
