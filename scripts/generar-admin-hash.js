const bcrypt = require("bcrypt");

const password =
  process.argv[2];

if (!password) {
  console.error(
    'Uso: node scripts/generar-admin-hash.js "TuContraseña"'
  );
  process.exit(1);
}

bcrypt
  .hash(password, 12)
  .then(hash => {
    console.log(hash);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
