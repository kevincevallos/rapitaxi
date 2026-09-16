import {
  Router,
} from "express";

import {
  cambiarModoManualController,
  enviarMensajeAdminController,
  listarChatsController,
  obtenerChatController,
} from "../controllers/admin-chat.controller";


const router = Router();


router.get(
  "/",
  listarChatsController
);

router.get(
  "/:telefono",
  obtenerChatController
);

router.post(
  "/:telefono/mensaje",
  enviarMensajeAdminController
);

router.patch(
  "/:telefono/manual",
  cambiarModoManualController
);


export default router;
