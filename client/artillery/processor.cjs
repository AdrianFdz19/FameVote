const { SignJWT } = require('jose');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const secretString = process.env.JWT_SECRET || 'fallback-secret-key-famvote-2026';
const secretKey = new TextEncoder().encode(secretString);

async function generateAuthCookie(requestParams, context, ee) {
  const userId = uuidv4();

  const token = await new SignJWT({
    userId: userId,
    email: `test-${userId.substring(0, 8)}@famvote.internal`,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);

  // Asegurar inicialización y formato exacto de Cookie
  if (!requestParams.headers) {
    requestParams.headers = {};
  }
  
  requestParams.headers.cookie = `auth_token=${token}`;
  requestParams.headers.Cookie = `auth_token=${token}`;
}

module.exports = {
  generateAuthCookie,
};