import { Router, type IRouter } from "express";
import healthRouter from "./health";
import datascoutRouter from "./datascout";

const router: IRouter = Router();

router.use(healthRouter);
router.use(datascoutRouter);

export default router;
