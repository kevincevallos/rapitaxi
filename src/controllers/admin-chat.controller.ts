import {
  Request,
  Response,
} from "express";

import {
  cambiarAtencionManual,
  listarChatsAdmin,
  normalizarTelefonoChat,
  obtenerMensajesChat,
} from "../services/chat.service";

import {
  enviarTextoWhatsApp,
} from "../services/whatsapp.service";


export async function listarChatsController(
  _req: Request,
  res: Response
) {
  try {
    const chats =
      await listarChatsAdmin();

    res.json({
      success: true,
      chats,
    });

  } catch (error) {
    console.error(
      "Error listando chats:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudieron cargar los chats.",
    });
  }
}


export async function obtenerChatController(
  req: Request,
  res: Response
) {
  try {
    const telefono =
      normalizarTelefonoChat(
        String(
          req.params.telefono ||
          ""
        )
      );

    if (!telefono) {
      res.status(400).json({
        success: false,
        message:
          "Teléfono inválido.",
      });
      return;
    }

    const chat =
      await obtenerMensajesChat(
        telefono
      );

    res.json({
      success: true,
      chat,
    });

  } catch (error) {
    console.error(
      "Error cargando chat:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo cargar la conversación.",
    });
  }
}


export async function enviarMensajeAdminController(
  req: Request,
  res: Response
) {
  try {
    const telefono =
      normalizarTelefonoChat(
        String(
          req.params.telefono ||
          ""
        )
      );

    const mensaje =
      String(
        req.body?.mensaje ||
        ""
      ).trim();

    if (!telefono) {
      res.status(400).json({
        success: false,
        message:
          "Teléfono inválido.",
      });
      return;
    }

    if (!mensaje) {
      res.status(400).json({
        success: false,
        message:
          "Escribe un mensaje.",
      });
      return;
    }

    await enviarTextoWhatsApp(
      telefono,
      mensaje
    );

    res.json({
      success: true,
    });

  } catch (error) {
    console.error(
      "Error enviando mensaje desde admin:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo enviar el mensaje.",
    });
  }
}


export async function cambiarModoManualController(
  req: Request,
  res: Response
) {
  try {
    const telefono =
      normalizarTelefonoChat(
        String(
          req.params.telefono ||
          ""
        )
      );

    const activo =
      req.body?.activo === true;

    if (!telefono) {
      res.status(400).json({
        success: false,
        message:
          "Teléfono inválido.",
      });
      return;
    }

    const conversacion =
      await cambiarAtencionManual(
        telefono,
        activo
      );

    res.json({
      success: true,
      conversacion,
    });

  } catch (error) {
    console.error(
      "Error cambiando atención manual:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo cambiar el modo de atención.",
    });
  }
}
