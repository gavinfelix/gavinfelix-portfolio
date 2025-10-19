import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET!;

export function encodeJwt(user: { id: string; type: "guest" | "regular" }) {
  const payload = {
    sub: user.id,
    type: user.type,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
  return token;
}
