import Koa from 'koa';
import router from "./router";
import bodyParser from "koa-bodyparser";
import baseMongoDb from "./model/baseMongoDb";
import helmet from "koa-helmet";
import path from "path"
import koaLogger from "koa-logger";
import cookie from "koa-cookie";
import { envConfig, getHostConfig, OPERATE_ENV, RunEnvType } from './config';
import Logger from './util/logger';
import { redisUniqueClientKey } from "./config/redisKey";
import { Jira_Sync } from './task/Jira_Sync';
const koaBody = require('koa-body');

const configLoader = async () => {
    // 导入配置
    await getHostConfig();
    Logger.INSTANCE.info("Get_TargetEnv", OPERATE_ENV);
    Logger.INSTANCE.info("Get_App_Global_Config", envConfig);
};

// 全局App
let app: any = null;

// 创建APP对象
const createApp = async () => {
    app = new Koa();

    const session = require("koa-generic-session");

    const rStore = require("koa-redis");

    const config = envConfig;

    const redisStore = rStore({
        // Options specified here
        host: config.GlobalConfig.REDIS.HOST,
        port: config.GlobalConfig.REDIS.PORT,
        password: config.GlobalConfig.REDIS.PASSWORD,
    });

    app.keys = ["dlc", "keylc"];
    app.use(helmet());
    app.use(
        session({
            store: redisStore,
            ttl: 3600 * 1000 * 24,
            rolling: true,
        })
    );
    app.use(cookie());
    app.use(
        koaLogger((str: any) => {
            Logger.INSTANCE.info(str);
        })
    );

    app.use(async (ctx: any, next: any) => {
        ctx.set("Access-Control-Allow-Origin", "*");
        ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
        await next();
    });

    // 设置 koa-body 中间件
    app.use(koaBody({
        multipart: true,
        formidable: {
            maxFileSize: 5000 * 1024 * 1024, // 设置上传文件大小最大限制，默认2M
            uploadDir: path.join(process.cwd(), "_uploadDir"),
            onFileBegin: (name: any, file: any) => {
                file.newFilename = `${file.newFilename}_${file.originalFilename}`;
                file.filepath = `_uploadDir/${file.newFilename}`;
            },
        }
    }));

    app.use(bodyParser());
    const whiteList = [
        "/api/base/saveOrUpdate"
    ];

    app.use(async (ctx: any, next: any) => {
        console.log(ctx.originalUrl.split('?')[0])
        if (whiteList.includes(ctx.originalUrl.split('?')[0])) {
            await next();
            return;
        }
        if (OPERATE_ENV === RunEnvType.local) {
            await next();
            return;
        }
        if (!ctx.session.userInfo) {
            ctx.body = {
                code: 401,
                msg: "请重新登录",
            };
        } else {
            let curSessionId = await redisStore.client.get(
                `${redisUniqueClientKey}${ctx.session.userInfo.username}`
            );
            if (curSessionId.replace(/\"/g, "") !== ctx.sessionId) {
                ctx.body = {
                    code: 401,
                    msg: "账号已在其他地方登录，请重新登录",
                };
            } else {
                await next();
            }
        }
    });
    app.use(router.routes()).use(router.allowedMethods());

    Jira_Sync()

    const port = 8620;
    app.listen(port, () => {
        Logger.INSTANCE.info(`Server is running at http://localhost:${port}`);
    });
};

// 主函数
const main = async () => {
    // await configLoader();

    await configLoader();
    await baseMongoDb.INSTANCE.connect();

    await createApp();

};

main();