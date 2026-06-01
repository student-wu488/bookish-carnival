# 净网守护 - 抖音评论过滤浏览器插件

## 📦 安装步骤

### 1. 生成图标文件

打开浏览器，访问 `douyin-comment-filter/generate-icons.html` 文件，浏览器会自动下载三个图标文件：
- icon16.png
- icon48.png
- icon128.png

或者手动创建图标：
1. 打开 `generate-icons.html`
2. 右键点击每个图标
3. 选择"图片另存为"
4. 保存到 `icons` 文件夹

### 2. 加载插件到 Chrome/Edge

#### Chrome 浏览器：
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 打开右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `douyin-comment-filter` 文件夹
6. 插件安装成功！

#### Edge 浏览器：
1. 打开 Edge 浏览器
2. 访问 `edge://extensions/`
3. 打开左下角的"开发人员模式"
4. 点击"加载未打包的扩展"
5. 选择 `douyin-comment-filter` 文件夹
6. 插件安装成功！

### 3. 启动后端服务

确保后端服务器正在运行：

```bash
cd c:\Users\huawei\Desktop\tace\product-1
npm run dev
```

后端服务应该运行在 `http://localhost:3000`

### 4. 使用插件

1. 访问网页版抖音：https://www.douyin.com
2. 打开任意视频，查看评论区
3. 插件会自动监控评论并进行审核
4. 违规评论会被标记红色边框和"⚠️ 已过滤"标签
5. 点击浏览器右上角的插件图标，可以查看统计数据

## 🔧 功能说明

### 自动监控
- 实时监控抖音评论区的评论内容
- 自动检测新评论并进行审核
- 使用 MutationObserver 监听 DOM 变化

### 内容审核
- 调用后端 API 进行内容审核
- 识别违规内容（暴力、色情、垃圾广告等）
- 标记违规评论

### 统计面板
- 总评论数统计
- 已过滤评论数统计
- 已通过评论数统计
- 待审核评论数统计
- 后端服务状态显示

### 视觉标记
- 违规评论红色高亮
- 添加"⚠️ 已过滤"标签
- 不删除评论，仅做标记

## 🎨 自定义配置

编辑 `content.js` 文件中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  API_URL: 'http://localhost:3000/api/moderation/check',
  CHECK_INTERVAL: 1000, // 检查间隔（毫秒）
  MAX_CHECKED: 100, // 最多检查的评论数
};
```

## 🐛 故障排除

### 插件不工作
1. 检查后端服务是否运行在 3000 端口
2. 刷新抖音页面
3. 打开浏览器控制台（F12）查看错误日志

### 无法连接后端
1. 确保运行 `npm run dev` 启动后端
2. 检查防火墙设置
3. 确认 API 地址配置正确

### 图标显示异常
1. 确保 `icons` 文件夹中有三个 PNG 图标文件
2. 重新生成图标文件
3. 重新加载插件

## 📝 技术栈

- **Manifest V3**: 最新的浏览器扩展标准
- **Service Worker**: 后台服务
- **Content Script**: 页面脚本
- **MutationObserver**: DOM 变化监听
- **Chrome Storage**: 本地数据存储

## 📞 支持

如有问题，请查看浏览器控制台日志或联系开发者。
