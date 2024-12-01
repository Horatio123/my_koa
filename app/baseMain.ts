

class baseMain {
    public static readonly INSTANCE = new baseMain();

    async saveOrUpdate(ctx: any) {
        try {
            const query = ctx.request.query;
            const key = query.issueKey;
            console.log("saveOrUpdateREQ jira key is ", key)
            if (key === null || key === undefined || !key) {
                Logger.INSTANCE.info("saveOrUpdateREQ: jira key is null, undefined or empty, ignore");
                return
            }
            Logger.INSTANCE.info("saveOrUpdateREQ ");
            let res = await REQbaseService.INSTANCE.saveOrUpdateREQ(key);
            ctx.body = {
                success: true,
                code: "success",
                data: res,
            };
        } catch (error) {
            ctx.body = {
                success: false,
                code: "fail",
                message: "save req task error",
            };
        }
    }
}
export default baseMain;