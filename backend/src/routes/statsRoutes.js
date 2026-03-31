import express from "express";
import { getHomeStats } from "../controllers/statsController.js";

const r = express.Router();
r.get("/home", getHomeStats);   // public — no auth required

export default r;