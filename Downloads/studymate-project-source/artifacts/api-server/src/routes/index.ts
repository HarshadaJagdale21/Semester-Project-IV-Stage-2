import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studyMateRouter from "./studymate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studyMateRouter);

export default router;
