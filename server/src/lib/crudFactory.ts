import { Router } from "express";
import { prisma } from "./prisma";

type PrismaDelegate = {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any | null>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

interface CrudOptions {
  include?: Record<string, any>;
  orderBy?: Record<string, any> | Record<string, any>[];
  // Optional transform applied to the request body before create/update
  beforeWrite?: (body: any) => any;
  // Query string keys that may be used as an exact-match filter, e.g. ?classId=xyz
  filterKeys?: string[];
}

/**
 * Builds a standard list/get/create/update/delete REST router for a Prisma model.
 * Keeps ~20 structurally-identical modules (Contacts, CPD, Qualifications, etc.)
 * from needing hand-written route files.
 */
export function crudRouter(modelName: string, options: CrudOptions = {}) {
  const router = Router();
  const delegate = (prisma as any)[modelName] as PrismaDelegate;

  router.get("/", async (req, res) => {
    const where: Record<string, any> = {};
    for (const key of options.filterKeys ?? []) {
      if (typeof req.query[key] === "string") {
        where[key] = req.query[key];
      }
    }
    const items = await delegate.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: options.include,
      orderBy: options.orderBy,
    });
    res.json(items);
  });

  router.get("/:id", async (req, res) => {
    const item = await delegate.findUnique({
      where: { id: req.params.id },
      include: options.include,
    });
    if (!item) return res.status(404).json({ error: "Not found." });
    res.json(item);
  });

  router.post("/", async (req, res) => {
    const data = options.beforeWrite ? options.beforeWrite(req.body) : req.body;
    try {
      const item = await delegate.create({ data, include: options.include });
      res.status(201).json(item);
    } catch (e: any) {
      res.status(400).json({ error: e.message ?? "Could not create." });
    }
  });

  router.put("/:id", async (req, res) => {
    const data = options.beforeWrite ? options.beforeWrite(req.body) : req.body;
    try {
      const item = await delegate.update({
        where: { id: req.params.id },
        data,
        include: options.include,
      });
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ error: e.message ?? "Could not update." });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (e: any) {
      res.status(400).json({ error: e.message ?? "Could not delete." });
    }
  });

  return router;
}
