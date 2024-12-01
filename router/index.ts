import Router from "koa-router";
import baseMain from "../app/baseMain";

const router = new Router({
    prefix: "/api/base",
});

// router.get("/getTree", baseMain.INSTANCE.getTree);
router.post("/saveOrUpdate", baseMain.INSTANCE.saveOrUpdate);


export default router;