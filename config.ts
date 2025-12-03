import dotenv from "dotenv";
dotenv.config(); 

export const config = {
  port: Number.parseInt(process.env.PORT || "3000"),
  allowedOrigins: getEnv(process.env.ALLOWED_ORIGINS, "ALLOWED_ORIGINS"),
};

function getEnv(value: string | undefined, variableName: string) {
  if (!value) { throw new Error(`Missing env variable: ${variableName}`); }
  return value;
}
