import {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";


export interface AdminSesionPayload {
  tipo: "admin";
  usuario: string;
}


function obtenerCookie(
  req: Request,
  nombre: string
) {
  const cabecera =
    String(
      req.headers.cookie || ""
    );

  const cookies =
    cabecera
      .split(";")
      .map(
        parte =>
          parte.trim()
      );

  for (
    const cookie
    of cookies
  ) {
    const indice =
      cookie.indexOf("=");

    if (indice <= 0) {
      continue;
    }

    const clave =
      cookie.slice(0, indice);

    if (clave !== nombre) {
      continue;
    }

    return decodeURIComponent(
      cookie.slice(indice + 1)
    );
  }

  return "";
}


export function obtenerSesionAdmin(
  req: Request
): AdminSesionPayload | null {
  const token =
    obtenerCookie(
      req,
      "rapitaxi_admin"
    );

  const secreto =
    String(
      process.env.ADMIN_JWT_SECRET ||
      ""
    );

  if (
    !token ||
    secreto.length < 32
  ) {
    return null;
  }

  try {
    const payload =
      jwt.verify(
        token,
        secreto
      ) as jwt.JwtPayload;

    if (
      payload.tipo !== "admin" ||
      typeof payload.usuario !==
        "string"
    ) {
      return null;
    }

    return {
      tipo: "admin",
      usuario:
        payload.usuario,
    };

  } catch {
    return null;
  }
}


export function requiereAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sesion =
    obtenerSesionAdmin(req);

  if (!sesion) {
    return res.status(401).json({
      success: false,
      message:
        "Debes iniciar sesión como administrador.",
      code:
        "ADMIN_NO_AUTENTICADO",
    });
  }

  res.locals.admin =
    sesion;

  return next();
}


export function requiereAdminPagina(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sesion =
    obtenerSesionAdmin(req);

  if (!sesion) {
    return res.redirect(
      "/login.html"
    );
  }

  res.locals.admin =
    sesion;

  return next();
}
