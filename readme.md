~/my-repo$ rush init
生成以下文件：https://rushjs.io/zh-cn/pages/maintainer/setup_new_repo/

common/config/rush/.npmrc Rush 用该文件配置源，无论是 PNPM, NPM 或者 Yarn
common/config/rush/command-line.json 用于自定义 Rush 的命令行命令或参数
common/config/rush/common-versions.json 用于指定 NPM 包的版本，它影响 Rush 仓库下所有项目
common/config/rush/pnpmfile.js	用于解决 package.json 文件下错误的依赖关系(如果不使用 PNPM 可以删除)
common/config/rush/version-policies.json 用于定义发布配置