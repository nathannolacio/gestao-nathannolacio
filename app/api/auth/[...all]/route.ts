import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/better-auth";

// Recebe todas as chamadas do Better Auth (/api/auth/sign-in/email, sign-out,
// get-session...). O cadastro continua bloqueado por disableSignUp.
export const { GET, POST } = toNextJsHandler(auth);
