import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_NAME = "psh_session";
const isProd = process.env.NODE_ENV === "production";

function issueSession(res: import("express").Response) {
  const token = jwt.sign({ sub: "teacher" }, JWT_SECRET, { expiresIn: "30d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

// GET /api/auth/status — tells the client whether first-run setup is needed and whether logged in
router.get("/status", async (req, res) => {
  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
  const setupDone = !!config?.setupDone;

  let authenticated = false;
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  res.json({
    setupDone,
    authenticated,
    teacherName: config?.teacherName ?? "",
    schoolName: config?.schoolName ?? "",
  });
});

// POST /api/auth/setup — first run only: create passcode
router.post("/setup", async (req, res) => {
  const existing = await prisma.appConfig.findUnique({ where: { id: 1 } });
  if (existing?.setupDone) {
    return res.status(400).json({ error: "Setup has already been completed." });
  }

  const { passcode, teacherName, schoolName } = req.body ?? {};
  if (!passcode || typeof passcode !== "string" || passcode.length < 4) {
    return res.status(400).json({ error: "Passcode must be at least 4 characters." });
  }

  const passcodeHash = await bcrypt.hash(passcode, 10);
  await prisma.appConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      passcodeHash,
      teacherName: teacherName ?? "",
      schoolName: schoolName ?? "",
      setupDone: true,
    },
    update: {
      passcodeHash,
      teacherName: teacherName ?? "",
      schoolName: schoolName ?? "",
      setupDone: true,
    },
  });

  issueSession(res);
  res.json({ ok: true });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { passcode } = req.body ?? {};
  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
  if (!config?.setupDone) {
    return res.status(400).json({ error: "Setup has not been completed yet." });
  }

  const valid = passcode && (await bcrypt.compare(passcode, config.passcodeHash));
  if (!valid) {
    return res.status(401).json({ error: "Incorrect passcode." });
  }

  issueSession(res);
  res.json({ ok: true });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// POST /api/auth/change-passcode
router.post("/change-passcode", async (req, res) => {
  const { currentPasscode, newPasscode } = req.body ?? {};
  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
  if (!config) return res.status(400).json({ error: "Not set up yet." });

  const valid = currentPasscode && (await bcrypt.compare(currentPasscode, config.passcodeHash));
  if (!valid) return res.status(401).json({ error: "Current passcode is incorrect." });
  if (!newPasscode || newPasscode.length < 4) {
    return res.status(400).json({ error: "New passcode must be at least 4 characters." });
  }

  const passcodeHash = await bcrypt.hash(newPasscode, 10);
  await prisma.appConfig.update({ where: { id: 1 }, data: { passcodeHash } });
  res.json({ ok: true });
});

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
export default router;
