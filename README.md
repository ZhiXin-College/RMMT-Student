# RMMT Student (React + Shadcn)

React + TypeScript + Shadcn/UI 学生端前端，对接 RMMT-API。问卷按题目存储与渲染，不依赖整份 `questionnaire_json`。

## 如何运行（前端 + 后端）

### 1. 运行后端 RMMT-API

后端需要 **MySQL** 和 **Python 3**。

```bash
cd RMMT-API

# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 设置环境变量（数据库 + JWT）
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_NAME=roommate
export DB_USER=root
export DB_PASSWORD=你的数据库密码
export JWT_SECRET=你的JWT密钥   # 可选，有默认值

# 启动（默认 http://127.0.0.1:5001；macOS 上 5000 常被 AirPlay 占用，故用 5001）
python app.py
```

或用 Flask 命令：

```bash
export FLASK_APP=app.py
flask run --host=0.0.0.0 --port=5001
```

确保 MySQL 已安装并已创建数据库 `roommate`（或你在 `DB_NAME` 里填的库名）；若需初始化表结构，请使用项目中的 SQL 脚本（如 `sql/` 目录下）。

### 2. 运行前端 RMMT-Student-React

```bash
cd RMMT-Student-React

# 安装依赖
npm install

# 配置 API 地址（后端跑在本机 5001 端口时可直接用下面这行）
cp .env.example .env
# 如后端不在本机或端口不同，编辑 .env 中的 VITE_API_URL，例如：
# VITE_API_URL=http://localhost:5001

# 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

浏览器打开 **http://localhost:5173**，未登录会跳转到登录页；登录接口会请求 `VITE_API_URL + /api/student/login`，请确保后端已启动且地址正确。

### 3. 跨域与 Cookie

后端已开启 CORS（`supports_credentials=True`），前端通过 axios 发请求并携带 JWT。若前后端不同端口（如 5173 与 5001），无需额外配置即可正常请求。

---

## 技术栈

- Vite + React 18 + TypeScript
- React Router 6
- Shadcn/UI（Radix + Tailwind）
- Axios（JWT 认证与刷新）

## 环境

- Node 18+
- 后端 RMMT-API 需已启动

## 配置

复制 `.env.example` 为 `.env` 并设置 API 地址：

```bash
cp .env.example .env
# 编辑 .env，例如：
# VITE_API_URL=http://localhost:5001
```

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

产物在 `dist/`，可部署到任意静态托管。

## 路由

| 路径 | 说明 |
|------|------|
| `/` | 重定向到 `/guide` |
| `/login` | 登录（学号 + 密码） |
| `/guide` | 向导与说明 |
| `/questionnaire` | 问卷填写与权重设置 |
| `/roommates` | 舍友大厅（列表、筛选、分页） |
| `/roommates/:id` | 学生详情与只读问卷 |
| `/team/requests` | 组队邀请与申请（无队伍时） |
| `/team/my` | 我的队伍（有队伍时） |

## 问卷设计

- 题目来源：`GET /questionnaire/list`（`questionnaire_items`），不再使用 `questionnaire_json` 渲染。
- 答案：按题提交至 `POST /questionnaire/answer`，格式与 Vue 版一致。
- 管理端可按题维护：`POST/PUT/DELETE /api/admin/questionnaire/item`（见 RMMT-API）。

<!-- commit-test: 2026-06-02 -->
