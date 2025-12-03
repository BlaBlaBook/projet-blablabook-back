import { type Request, type Response } from "express";

export function healthCheck(req: Request, res: Response) {
  const url = req.url;
  const ip = req.ip;
  const headers = req.headers;
  const date = new Date();
  
  res.json({
    status: "OK",
    url,
    ip,
    headers,
    date
  });
}
