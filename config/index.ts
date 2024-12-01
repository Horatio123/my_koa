const env_param: any = process.argv.find((i) => i.includes("env"))
export let OPERATE_ENV: string = env_param ? env_param.substring(6) : "local"