import {
    Router,
} from "express";

import {
    registrarWebPushController,
    vapidPublicKeyController,
} from "../controllers/web-push.controller";


const router =
    Router();


router.get(
    "/public-key",
    vapidPublicKeyController
);


router.post(
    "/subscribe",
    registrarWebPushController
);


export default router;