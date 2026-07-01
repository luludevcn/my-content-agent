# Health Content AI - 功能规划路线图

> **定位**：不是 Demo，而是专门为英文健康站设计的 AI 编辑部，目标生产 800~1000 篇高质量文章

---

## 📊 当前状态评估

### 已实现功能

| 功能模块 | 状态 | 说明 |
|----------|------|------|
| 文章生成 | ✅ 完成 | 支持流式和非流式生成 |
| SEO优化 | ✅ 完成 | 标题、元描述、关键词生成 |
| 医疗审核 | ✅ 完成 | 医学准确性检查 |
| RAG检索 | ✅ 完成 | Qdrant向量数据库集成 |
| 内部链接 | ✅ 完成 | 自动建议相关文章 |
| 主题规划 | ✅ 完成 | 基础主题建议 |
| 提示词工作室 | ✅ 完成 | 提示词管理界面 |
| 知识库 | ✅ 完成 | 静态知识文档展示 |
| 仪表盘 | ✅ 完成 | 数据概览统计 |

### 待实现功能

---

## 🎯 MVP 阶段（第 1-2 周）- 边开发边使用

### 核心工作流（必须完成）

**Topic → Intent Analysis → RAG Search → Outline → Writer → SEO → Medical Review → Internal Links → Markdown Export**

#### 1. LangGraph 工作流编排
- [ ] 使用 LangGraph 重构 Agent 协作流程
- [ ] 实现有状态的多步骤生成
- [ ] 支持中途停止和重试
- [ ] 步骤间数据传递与状态管理

#### 2. Intent Agent 增强
- [ ] 支持多种搜索意图分析（Informational/Commercial/Comparison/Symptoms/Treatment/How-to）
- [ ] 输出：Intent + Target Audience + Entities + Related Topics
- [ ] 读取 knowledge/ 中的写作指南

#### 3. RAG Agent 增强
- [ ] 搜索站内所有文章（Top 10）
- [ ] 重复检测（避免生成相似文章）
- [ ] 结果传递给 Writer Agent

#### 4. Outline Agent 增强
- [ ] 固定栏目结构：What is it? → Common causes → Symptoms → When to see a doctor → What may help → Key takeaway
- [ ] 输出：H1 + H2 + H3 + FAQ + Summary
- [ ] 读取 knowledge/style-guide.md

#### 5. Writer Agent 增强
- [ ] 专注于正文写作
- [ ] Prompt 固定，不负责 SEO/FAQ/Schema
- [ ] 读取 knowledge/ 中的所有指南
- [ ] 接收 RAG 结果避免重复

#### 6. SEO Agent 增强
- [ ] 负责：Title + Meta + Description + Slug + Keywords
- [ ] 生成 JSON-LD Schema
- [ ] 读取 knowledge/seo-guide.md

#### 7. Medical Review Agent 增强（最重要）
- [ ] 医学准确性检查
- [ ] 将绝对语句改为谨慎语言（"cures" → "may help reduce"）
- [ ] 添加医学免责声明
- [ ] 读取 knowledge/medical-guidelines.md

#### 8. Internal Link Agent 增强
- [ ] 自动搜索相关文章
- [ ] 推荐内部链接（相关性排序）
- [ ] 读取 RAG 结果

#### 9. Publisher Agent（新增）
- [ ] 输出标准 Next.js Markdown 格式
- [ ] Frontmatter：title + metaTitle + metaDescription + excerpt + slug + category + tags
- [ ] 包含 FAQ 部分
- [ ] 包含 Schema 标记
- [ ] 一键复制到剪贴板

### Dashboard 页面优化

#### 10. New Article 页面（核心）
- [ ] Keyword 输入框
- [ ] Audience 选择（Seniors/Caregivers/General）
- [ ] Length 选择（1500/2000/3000 words）
- [ ] Category 选择（Arthritis/Heart Health/Mobility/Balance/Nutrition/Exercise/Mental Health/Elderly Care/Chronic Pain/Fall Prevention）
- [ ] Tone 选择（Friendly/Professional/Authoritative/Conversational/Empathetic）
- [ ] Generate 按钮
- [ ] 实时进度展示（步骤状态）
- [ ] 生成结果展示与复制

#### 11. Optimize 页面
- [ ] 文章质量评分
- [ ] SEO 评分可视化
- [ ] 可读性分析
- [ ] 一键优化建议

#### 12. Topic Planner 页面
- [ ] 关键词搜索建议
- [ ] 搜索量趋势分析（后续接入 Search Console）
- [ ] 竞争分析
- [ ] 主题集群规划

#### 13. Knowledge 页面
- [ ] 展示所有知识文档
- [ ] 支持在线编辑
- [ ] 实时预览

#### 14. Prompt Studio 页面
- [ ] 所有 Agent 的 Prompt 管理
- [ ] 在线编辑 Prompt
- [ ] 保存与版本管理
- [ ] 无需改代码即可调整

#### 15. Settings 页面
- [ ] Ollama 配置（模型选择、温度调整）
- [ ] Qdrant 配置
- [ ] 输出格式配置
- [ ] 文章默认设置

---

## 🚀 第二阶段（第 3-4 周）- 生产就绪

### 16. 数据库集成（PostgreSQL + Prisma）
- [ ] 文章存储与管理
- [ ] 生成历史记录
- [ ] 用户偏好设置
- [ ] 主题规划数据存储

### 17. 批量文章生成
- [ ] 批量关键词输入
- [ ] 队列任务管理
- [ ] 批量生成进度追踪
- [ ] 批量导出功能

### 18. 内容调度发布
- [ ] 定时发布功能
- [ ] 发布日程管理
- [ ] 自动发布到 CMS

### 19. 搜索控制台集成
- [ ] Google Search Console API
- [ ] Bing Webmaster API
- [ ] 流量数据导入
- [ ] SEO 效果追踪

---

## 💡 第三阶段（第 5-8 周）- 高级功能

### 20. 数据分析与报告
- [ ] 生成数据分析仪表盘
- [ ] 内容表现报告
- [ ] SEO 效果追踪

### 21. 图片生成集成
- [ ] AI 图片生成 API 集成
- [ ] 文章插图自动生成
- [ ] 图片 alt 文本生成

### 22. 关键词研究工具
- [ ] 关键词搜索量分析
- [ ] 关键词难度评估
- [ ] 长尾关键词建议

### 23. A/B 测试工具
- [ ] 标题 A/B 测试
- [ ] 内容变体测试

### 24. Webhook 与集成
- [ ] CMS 系统集成（WordPress、Ghost 等）
- [ ] 社交媒体自动发布

---

## 📚 知识库结构

```
knowledge/
├── style-guide.md        # 写作风格指南
├── medical-guidelines.md # 医学指南
├── seo-guide.md          # SEO 指南
├── writing-tone.md       # 语气风格指南
├── faq-rules.md          # FAQ 规则
└── eeat.md               # EEAT 指南
```

每个 Agent 在执行时自动读取相关知识文档。

---

## 🔧 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js（App Router） | 后台管理界面 |
| UI | shadcn/ui + Tailwind CSS | 组件库 |
| Agent 编排 | LangGraph | 多 Agent 工作流 |
| LLM | Ollama（Qwen3 14B） | 本地大语言模型 |
| Embedding | BGE-M3 | 通过 Ollama |
| Vector DB | Qdrant | 本地向量数据库 |
| ORM | Prisma | 数据库操作 |
| Database | PostgreSQL | 数据存储 |
| Markdown | gray-matter + remark | 处理 Markdown |
| Background Jobs | Inngest | 异步任务队列 |

---

## 📅 建议时间线

| 阶段 | 周期 | 重点功能 | 产出 |
|------|------|----------|------|
| MVP | 第 1-2 周 | LangGraph工作流、8个Agent、6个页面 | 可替代ChatGPT写内容 |
| 生产就绪 | 第 3-4 周 | PostgreSQL集成、批量生成、搜索控制台 | 每天稳定生产文章 |
| 高级功能 | 第 5-8 周 | 数据分析、图片生成、关键词研究 | 完整内容操作系统 |

---

## 📝 核心原则

1. **完全本地运行** - Qwen3 + Ollama，数据隐私安全
2. **固定栏目结构** - 每篇文章统一风格
3. **Prompt 可配置** - 无需改代码即可调整
4. **边开发边使用** - 每完成一个Agent即可投入使用
5. **医学安全第一** - Medical Review是最重要的环节
6. **输出即生产** - 生成的Markdown直接可用

---

## 🎯 最终目标

输入一个 Topic，30~60 秒后得到：
- ✅ 完整文章
- ✅ SEO（Title/Meta/Description/Slug/Keywords）
- ✅ FAQ
- ✅ Internal Links
- ✅ Schema（JSON-LD）
- ✅ Meta
- ✅ Markdown（可直接复制到Next.js项目）
