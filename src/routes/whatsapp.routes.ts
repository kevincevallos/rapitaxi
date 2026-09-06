import {
  Router,
} from "express";

import {
  kapsoWebhookController,
} from "../controllers/whatsapp.controller";


const router =
  Router();


router.post(
  "/kapso",
  kapsoWebhookController
);


export default router;