import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// 模拟数据
const mockStats = {
  total: 1256,
  blocked: 892,
  pending: 156,
  approved: 208,
  todayCount: 156,
  categoryDistribution: {
    violence: 380,
    emotion: 270,
    porn: 180,
    spam: 120,
    other: 106
  },
  weeklyTrend: [
    { date: '周一', blocked: 180, pending: 140, approved: 620 },
    { date: '周二', blocked: 220, pending: 180, approved: 550 },
    { date: '周三', blocked: 150, pending: 120, approved: 700 },
    { date: '周四', blocked: 280, pending: 200, approved: 480 },
    { date: '周五', blocked: 240, pending: 160, approved: 580 },
    { date: '周六', blocked: 320, pending: 240, approved: 400 },
    { date: '今日', blocked: 350, pending: 280, approved: 350 },
  ],
  accuracy: 97.3,
  avgLatency: 84,
  pendingReview: 12
};

const mockContent = [
  { id: '1', userId: '1', contentType: 'text', content: '你这个垃圾，去死吧', author: '用户A', platform: '抖音', status: 'blocked', action: 'block', triggerRule: '暴力关键词', triggerCategory: 'violence', confidence: 0.95, sentiment: 'negative', appealStatus: null, appealNote: null, isEmergency: false, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
  { id: '2', userId: '1', contentType: 'text', content: '这视频真好看，支持作者', author: '用户B', platform: '抖音', status: 'approved', action: 'log', triggerRule: null, triggerCategory: null, confidence: null, sentiment: 'positive', appealStatus: null, appealNote: null, isEmergency: false, createdAt: '2024-01-15T10:31:00Z', updatedAt: '2024-01-15T10:31:00Z' },
  { id: '3', userId: '1', contentType: 'text', content: '敏感词测试内容', author: '用户C', platform: '抖音', status: 'blocked', action: 'block', triggerRule: '自定义敏感词', triggerCategory: 'custom', confidence: 0.88, sentiment: 'negative', appealStatus: 'pending', appealNote: '可能是误判', isEmergency: false, createdAt: '2024-01-15T10:32:00Z', updatedAt: '2024-01-15T10:35:00Z' },
  { id: '4', userId: '1', contentType: 'text', content: '免费领取游戏皮肤，点击链接', author: '用户D', platform: '快手', status: 'blocked', action: 'block', triggerRule: '广告检测', triggerCategory: 'spam', confidence: 0.92, sentiment: 'neutral', appealStatus: null, appealNote: null, isEmergency: false, createdAt: '2024-01-15T10:33:00Z', updatedAt: '2024-01-15T10:33:00Z' },
  { id: '5', userId: '1', contentType: 'text', content: '这个视频太棒了！', author: '用户E', platform: 'B站', status: 'approved', action: 'log', triggerRule: null, triggerCategory: null, confidence: null, sentiment: 'positive', appealStatus: null, appealNote: null, isEmergency: false, createdAt: '2024-01-15T10:34:00Z', updatedAt: '2024-01-15T10:34:00Z' },
  { id: '6', userId: '1', contentType: 'text', content: '我要自杀，活着没意思', author: '用户F', platform: '抖音', status: 'pending', action: 'warn', triggerRule: '紧急预警', triggerCategory: 'emotion', confidence: 0.98, sentiment: 'negative', appealStatus: null, appealNote: null, isEmergency: true, createdAt: '2024-01-15T10:35:00Z', updatedAt: '2024-01-15T10:35:00Z' },
  { id: '7', userId: '1', contentType: 'text', content: '转发此视频，好运连连', author: '用户G', platform: '抖音', status: 'blocked', action: 'block', triggerRule: '垃圾广告', triggerCategory: 'spam', confidence: 0.85, sentiment: 'neutral', appealStatus: null, appealNote: null, isEmergency: false, createdAt: '2024-01-15T10:36:00Z', updatedAt: '2024-01-15T10:36:00Z' },
  { id: '8', userId: '1', contentType: 'text', content: '支持正能量，反对网络暴力', author: '用户H', platform: '快手', status: 'approved', action: 'log', triggerRule: null, triggerCategory: null, confidence: null, sentiment: 'positive', appealStatus: null, appealNote: null, isEmergency: false, createdAt: '2024-01-15T10:37:00Z', updatedAt: '2024-01-15T10:37:00Z' },
];

const mockRules = [
  { id: '1', userId: '1', name: '暴力内容过滤', category: 'violence', action: 'block', enabled: true, description: '拦截包含暴力、攻击性语言的内容', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { id: '2', userId: '1', name: '色情内容检测', category: 'porn', action: 'block', enabled: true, description: '识别并屏蔽低俗色情内容', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { id: '3', userId: '1', name: '垃圾广告过滤', category: 'spam', action: 'block', enabled: true, description: '拦截营销广告和垃圾信息', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { id: '4', userId: '1', name: '负面情绪检测', category: 'emotion', action: 'warn', enabled: true, description: '识别消极情绪内容，发送预警', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { id: '5', userId: '1', name: '图像内容审核', category: 'image', action: 'block', enabled: false, description: '检测图片中的违规内容', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { id: '6', userId: '1', name: '音频内容审核', category: 'audio', action: 'log', enabled: true, description: '记录音频内容供后续分析', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
];

const mockKeywords = [
  { id: '1', userId: '1', keyword: '敏感词', category: 'custom', action: 'block', createdAt: '2024-01-05T00:00:00Z' },
  { id: '2', userId: '1', keyword: '去死', category: 'violence', action: 'block', createdAt: '2024-01-06T00:00:00Z' },
  { id: '3', userId: '1', keyword: '垃圾', category: 'violence', action: 'block', createdAt: '2024-01-07T00:00:00Z' },
  { id: '4', userId: '1', keyword: '免费领取', category: 'spam', action: 'block', createdAt: '2024-01-08T00:00:00Z' },
  { id: '5', userId: '1', keyword: '自杀', category: 'emotion', action: 'warn', createdAt: '2024-01-09T00:00:00Z' },
];

const mockReports = [
  { id: '1', userId: '1', contentText: '有人在评论区发布恶意言论', violationType: '网络暴力 / 人身攻击', status: 'resolved', platform: '抖音', notes: '已处理', createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-11T00:00:00Z' },
  { id: '2', userId: '1', contentText: '发现大量垃圾广告', violationType: '垃圾广告引流', status: 'pending', platform: '快手', notes: null, createdAt: '2024-01-14T00:00:00Z', updatedAt: '2024-01-14T00:00:00Z' },
  { id: '3', userId: '1', contentText: '视频包含低俗内容', violationType: '色情低俗内容', status: 'submitted', platform: 'B站', notes: '已提交平台', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
];

const mockSettings = {
  id: '1', userId: '1', filterLevel: 'standard', notificationMode: 'banner', emergencyAlerts: true, weeklyReport: true, stealthMode: false, autoLearn: true, syncEnabled: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z'
};

// ============================================
// Content Check - 不需要认证，用于浏览器扩展
// ============================================
router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, contentType } = req.body;
    
    console.log('收到内容审核请求:', content, contentType);
    
    // 简化处理，直接检查内容是否包含"敏感词"字符串
    const isViolation = contentType === 'text' && content && content.includes('敏感词');
    
    console.log('审核结果:', isViolation);
    
    // 直接返回结果
    res.json({
      success: true,
      data: {
        isViolation,
        violatedKeywords: isViolation ? ['敏感词'] : [],
        violatedCategory: isViolation ? 'other' : null,
        content,
        contentType
      }
    });
  } catch (e) { 
    console.error('审核错误:', e);
    next(e); 
  }
});

// ============================================
// Stats API
// ============================================
router.get('/stats', async (_req: Request, res: Response) => {
  res.json({ success: true, data: mockStats });
});

// ============================================
// Blocked Content API
// ============================================
router.get('/content', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const data = mockContent.slice(offset, offset + limit);
  res.json({ success: true, data });
});

router.put('/content/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const index = mockContent.findIndex(c => c.id === id);
  if (index !== -1) {
    mockContent[index] = { ...mockContent[index], ...updateData, updatedAt: new Date().toISOString() };
    res.json({ success: true, data: mockContent[index] });
  } else {
    res.status(404).json({ success: false, error: 'Content not found' });
  }
});

// ============================================
// Rules API
// ============================================
router.get('/rules', async (_req: Request, res: Response) => {
  res.json({ success: true, data: mockRules });
});

router.put('/rules/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const index = mockRules.findIndex(r => r.id === id);
  if (index !== -1) {
    mockRules[index] = { ...mockRules[index], ...updateData, updatedAt: new Date().toISOString() };
    res.json({ success: true, data: mockRules[index] });
  } else {
    res.status(404).json({ success: false, error: 'Rule not found' });
  }
});

// ============================================
// Keywords API
// ============================================
router.get('/keywords', async (_req: Request, res: Response) => {
  res.json({ success: true, data: mockKeywords });
});

router.post('/keywords', async (req: Request, res: Response) => {
  const { keyword, category = 'custom', action = 'block' } = req.body;
  const newKeyword = {
    id: Date.now().toString(),
    userId: '1',
    keyword,
    category,
    action,
    createdAt: new Date().toISOString()
  };
  mockKeywords.push(newKeyword);
  res.json({ success: true, data: newKeyword });
});

router.delete('/keywords/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const index = mockKeywords.findIndex(k => k.id === id);
  if (index !== -1) {
    mockKeywords.splice(index, 1);
    res.json({ success: true, data: { deleted: true } });
  } else {
    res.status(404).json({ success: false, error: 'Keyword not found' });
  }
});

// ============================================
// Reports API
// ============================================
router.get('/reports', async (_req: Request, res: Response) => {
  res.json({ success: true, data: mockReports });
});

router.post('/reports', async (req: Request, res: Response) => {
  const { contentText, violationType, platform, notes } = req.body;
  const newReport = {
    id: Date.now().toString(),
    userId: '1',
    contentText,
    violationType,
    platform,
    notes,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockReports.push(newReport);
  res.json({ success: true, data: newReport });
});

// ============================================
// Settings API
// ============================================
router.get('/settings', async (_req: Request, res: Response) => {
  res.json({ success: true, data: mockSettings });
});

router.put('/settings', async (req: Request, res: Response) => {
  const updateData = req.body;
  Object.assign(mockSettings, updateData, { updatedAt: new Date().toISOString() });
  res.json({ success: true, data: mockSettings });
});

// ============================================
// Export Report API
// ============================================
router.get('/export', async (_req: Request, res: Response) => {
  // 生成CSV报告
  const headers = ['ID', '内容', '作者', '平台', '状态', '触发规则', '置信度', '创建时间'];
  const rows = mockContent.map(item => [
    item.id,
    `"${item.content.replace(/"/g, '""')}"`, // 转义引号
    item.author || '',
    item.platform || '',
    item.status === 'blocked' ? '已屏蔽' : item.status === 'pending' ? '待审核' : item.status === 'approved' ? '已通过' : '已恢复',
    item.triggerRule || '',
    item.confidence ? `${(item.confidence * 100).toFixed(1)}%` : '',
    new Date(item.createdAt).toLocaleString('zh-CN')
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="moderation_report_${Date.now()}.csv"`);
  // 添加BOM以支持Excel正确识别UTF-8
  res.write('\uFEFF');
  res.end(csv);
});

export default router;
