import { OAuth2Client } from "google-auth-library";

export const googleCLientID = process.env.GOOGLE_CLIENT_ID;
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleCLientID) console.warn("⚠️ Google client id not set in environnment variables.")
if (!googleClientSecret) console.warn("⚠️ Google client secret not set in environnment variables.")

export const googleClient = new OAuth2Client(
  googleCLientID,
  googleClientSecret
);
