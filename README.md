# 网友侧写生成器

一个基于前端 H5 与后端代理的小应用：上传朋友圈截图，生成性格、兴趣、聊天话题与约会建议等分析结果。

## 功能概览
- 图片拖拽/选择与预览网格
- 最少 5 张、最多 20 张的选择限制
- 结果卡片：性格特征、兴趣爱好、追求建议、聊天话题、约会建议
- API 密钥配置（本地存储），通过后端代理转发到火山引擎接口
- 无密钥时返回本地示例（stub）数据，便于开发测试

## 快速开始
1. 安装依赖（后端）：
   - `python -m pip install flask requests`
2. 启动后端代理服务：
   - `python server.py`
3. 访问页面：
   - 打开 `http://localhost:8001/`
4. 在页面右上角“配置API密钥”中填入你的火山引擎密钥，或在系统中设置环境变量：
   - `VOLCANO_API_KEY=<你的密钥>`
5. 上传 5–20 张图片后点击“开始分析”，查看结果卡片。

## 接口说明
- 前端会向本地端点 `POST /api/analyze` 发送：
  ```json
  {
    "images": ["<base64>"],
    "prompt": "分析这些朋友圈图片…",
    "apiKey": "<可选，前端传入；否则使用环境变量>"
  }
  ```
- 后端行为：
  - 若提供有效密钥：转发到 `https://api.volcengine.com/doubao/v1.6/thinking` 并适配返回结构。
  - 若无密钥或使用占位值：返回本地 stub 结果（与前端展示结构一致）。
- 错误处理：
  - `401 UNAUTHORIZED`：密钥无效或权限不足
  - `502 NETWORK_ERROR`：网络异常
  - 其他 `API_ERROR/SERVER_ERROR`：具体信息见响应体

## 项目结构
```
project-friend/
├─ 网友侧写生成器.html   # 前端页面
├─ css/style.css          # 样式
├─ js/app.js              # 交互逻辑（调用 /api/analyze）
├─ server.py              # Flask 代理服务
├─ 朋友圈五宫格功能说明.md # 需求说明
├─ README.md              # 使用说明
└─ .gitignore             # 忽略文件配置
```

## 部署建议
- 生产环境请使用 WSGI 服务器（例如 gunicorn/uwsgi）或容器化部署，并在环境中设置 `VOLCANO_API_KEY`。
- 若发布为纯静态站点（GitHub Pages 等），将无法直接调用接口；可部署 `server.py` 至可访问的后端服务并将前端的 `fetch('/api/analyze')` 指向该地址。

## 许可证
- 未指定许可证；如需开源发布，请补充 LICENSE 文件。