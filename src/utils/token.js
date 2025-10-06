const generateToken = () => {
  const symbols =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%~123456789";
  let token = "";
  do {
    const randomNum = Math.floor(Math.random() * symbols.length);
    token += symbols[randomNum];
  } while (token.length < 64);

  return token
};


module.exports = generateToken