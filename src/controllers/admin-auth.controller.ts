import {
  Request,
  Response,
} from "express";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  obtenerSesionAdmin,
} from "../middlewares/admin-auth.middleware";


type IntentoLogin = {
  cantidad: number;
  bloqueadoHasta: number;
};

const intentos =
  new Map<string, IntentoLogin>();

const MAX_INTENTOS = 6;
const BLOQUEO_MS =
  10 * 60 * 1000;


function adminsConfigurados() {
  return [
    {
      usuario:
        String(
          process.env.ADMIN_1_USER ||
          ""
        ).trim(),
      passwordHash:
        String(
          process.env.ADMIN_1_PASSWORD_HASH ||
          ""
        ).trim(),
    },
    {
      usuario:
        String(
          process.env.ADMIN_2_USER ||
          ""
        ).trim(),
      passwordHash:
        String(
          process.env.ADMIN_2_PASSWORD_HASH ||
          ""
        ).trim(),
    },
  ].filter(
    admin =>
      admin.usuario &&
      admin.passwordHash
  );
}


function configuracionLista() {
  const secreto =
    String(
      process.env.ADMIN_JWT_SECRET ||
      ""
    );

  return (
    secreto.length >= 32 &&
    adminsConfigurados().length >= 1
  );
}


function claveIntento(
  req: Request,
  usuario: string
) {
  return `${req.ip || "ip"}:${usuario.toLowerCase()}`;
}


function cookieSesion(
  token: string,
  borrar = false
) {
  const produccion =
    process.env.NODE_ENV ===
    "production";

  const partes = [
    `rapitaxi_admin=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
  ];

  if (produccion) {
    partes.push("Secure");
  }

  if (borrar) {
    partes.push("Max-Age=0");
  } else {
    partes.push(
      `Max-Age=${12 * 60 * 60}`
    );
  }

  return partes.join("; ");
}


export async function loginAdminController(
  req: Request,
  res: Response
) {
  try {
    if (!configuracionLista()) {
      return res.status(503).json({
        success: false,
        message:
          "El acceso de administradores todavía no está configurado en el servidor.",
        code:
          "ADMIN_CONFIG_PENDIENTE",
      });
    }

    const usuario =
      String(
        req.body.usuario ||
        ""
      ).trim();

    const password =
      String(
        req.body.password ||
        ""
      );

    if (
      !usuario ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Escribe usuario y contraseña.",
      });
    }

    const clave =
      claveIntento(
        req,
        usuario
      );

    const intento =
      intentos.get(clave);

    if (
      intento &&
      intento.bloqueadoHasta >
        Date.now()
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Demasiados intentos. Intenta nuevamente en unos minutos.",
      });
    }

    const admin =
      adminsConfigurados()
        .find(
          item =>
            item.usuario
              .toLowerCase() ===
            usuario.toLowerCase()
        );

    const passwordValido =
      admin
        ? await bcrypt.compare(
          password,
          admin.passwordHash
        )
        : false;

    if (
      !admin ||
      !passwordValido
    ) {
      const cantidad =
        (intento?.cantidad || 0) + 1;

      intentos.set(
        clave,
        {
          cantidad:
            cantidad >= MAX_INTENTOS
              ? 0
              : cantidad,
          bloqueadoHasta:
            cantidad >= MAX_INTENTOS
              ? Date.now() +
                BLOQUEO_MS
              : 0,
        }
      );

      return res.status(401).json({
        success: false,
        message:
          "Usuario o contraseña incorrectos.",
      });
    }

    intentos.delete(clave);

    const secreto =
      String(
        process.env.ADMIN_JWT_SECRET
      );

    const token =
      jwt.sign(
        {
          tipo: "admin",
          usuario:
            admin.usuario,
        },
        secreto,
        {
          expiresIn: "12h",
          issuer:
            "rapitaxi",
          audience:
            "rapitaxi-admin",
        }
      );

    res.setHeader(
      "Set-Cookie",
      cookieSesion(token)
    );

    return res.json({
      success: true,
      usuario:
        admin.usuario,
    });

  } catch (error) {
    console.error(
      "Error iniciando sesión admin:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "No se pudo iniciar sesión.",
    });
  }
}


export function sesionAdminController(
  req: Request,
  res: Response
) {
  const sesion =
    obtenerSesionAdmin(req);

  if (!sesion) {
    return res.status(401).json({
      success: false,
      message:
        "Sesión no válida.",
    });
  }

  return res.json({
    success: true,
    usuario:
      sesion.usuario,
  });
}


export function logoutAdminController(
  _req: Request,
  res: Response
) {
  res.setHeader(
    "Set-Cookie",
    cookieSesion(
      "",
      true
    )
  );

  return res.json({
    success: true,
  });
}
