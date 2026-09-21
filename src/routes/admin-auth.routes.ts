import {
  Router,
} from "express";

import {
  loginAdminController,
  logoutAdminController,
  sesionAdminController,
} from "../controllers/admin-auth.controller";

import {
  requiereAdmin,
} from "../middlewares/admin-auth.middleware";


const router =
  Router();


router.post(
  "/login",
  loginAdminController
);

router.get(
  "/me",
  requiereAdmin,
  sesionAdminController
);

router.post(
  "/logout",
  requiereAdmin,
  logoutAdminController
);


export default router;
