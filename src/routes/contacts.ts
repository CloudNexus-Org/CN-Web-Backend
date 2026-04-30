import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.post("/", async (req, res) => {
  const b = req.body as {
    fullName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    interestedIn?: string;
    estimatedBudget?: string;
    heardFrom?: string;
    projectDetails?: string;
  };

  if (!b.fullName || !b.email || !b.interestedIn || !b.projectDetails) {
    res.status(400).json({
      error: "fullName, email, interestedIn and projectDetails are required",
    });
    return;
  }

  const row = await prisma.contactInquiry.create({
    data: {
      fullName: String(b.fullName).trim(),
      companyName: b.companyName ? String(b.companyName).trim() : null,
      email: String(b.email).toLowerCase().trim(),
      phone: b.phone ? String(b.phone).trim() : null,
      interestedIn: String(b.interestedIn).trim(),
      estimatedBudget: b.estimatedBudget ? String(b.estimatedBudget).trim() : null,
      heardFrom: b.heardFrom ? String(b.heardFrom).trim() : null,
      projectDetails: String(b.projectDetails).trim(),
    },
  });

  res.status(201).json({ id: row.id, message: "Inquiry received" });
});

export default router;
