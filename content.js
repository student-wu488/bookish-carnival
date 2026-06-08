// == 净网守护插件 ==
// 版本：1.3.0
// 功能：监控抖音评论区，过滤敏感词

console.log('=== 净网守护插件已加载 ===');

// 配置
const CONFIG = {
  CHECK_INTERVAL: 3000, // 检查间隔（毫秒）
  MAX_CHECKED: 50, // 每轮最大检查数量
  API_URL: 'http://localhost:3000/api/moderation/check'
};

// 已检查的评论ID集合
const checkedComments = new Set();

// 统计数据
let stats = {
  total: 0,
  filtered: 0,
  passed: 0,
  pending: 0
};

// 记录最后一次检查时间
let lastCheckTime = 0;

// 检查评论
function checkComments() {
  const now = Date.now();
  if (now - lastCheckTime < CONFIG.CHECK_INTERVAL) return;
  lastCheckTime = now;
  
  console.log('=== 开始检查评论 ===');
  
  // 获取所有评论容器（扩大选择范围）
  const commentContainers = document.querySelectorAll(
    '[class*="comment-item"], [class*="CommentItem"], ' +
    '[class*="comment-list"] > div, [class*="CommentList"] > div, ' +
    '[data-e2e*="comment"], [class*="reply-item"]'
  );
  console.log(`找到 ${commentContainers.length} 个评论容器`);
  
  let foundCount = 0;
  const currentBatch = new Set();
  
  commentContainers.forEach((container, index) => {
    if (foundCount >= CONFIG.MAX_CHECKED) return;
    
    // 输出容器的HTML结构（调试用）
    if (index < 2) {
      console.log(`容器${index} HTML结构:`, container.innerHTML.substring(0, 500));
    }
    
    // 使用精准选择器提取用户名和评论内容
    const username = extractUsername(container);
    const content = extractCommentContent(container);
    
    console.log(`提取结果: 用户名="${username || '未知'}", 评论="${content?.substring(0, 30)}..."`);
    
    if (!content || content.length < 2) {
      return;
    }
    
    // 生成唯一ID
    const commentId = generateId(container, content);
    
    // 检查是否已处理
    if (checkedComments.has(commentId)) {
      return;
    }
    
    if (currentBatch.has(commentId)) {
      return;
    }
    
    currentBatch.add(commentId);
    foundCount++;
    
    console.log(`检查评论 #${foundCount}: "${content.substring(0, 50)}..." (用户: ${username || '未知'})`);
    
    checkCommentContent(commentId, content, container, username);
  });
  
  console.log(`本轮检查完成，新增 ${foundCount} 条评论`);
}

// ====================
// 提取用户名（独立策略）
// 只在用户信息区域查找，不与评论内容混淆
// ====================
function extractUsername(container) {
  // 策略1：查找头像附近的用户名元素
  const avatar = container.querySelector('img[src*="avatar"], [class*="avatar"], [class*="head"]');
  if (avatar) {
    // 找头像的父容器下的name元素
    const avatarParent = avatar.parentElement;
    if (avatarParent) {
      // 查找父容器下的name相关元素
      const nameEl = avatarParent.querySelector('[class*="name"], [class*="nick"], .username, span');
      if (nameEl) {
        const text = nameEl.textContent?.trim();
        if (text && isValidUsername(text)) {
          return text;
        }
      }
      // 查找兄弟元素
      for (const sibling of avatarParent.children) {
        if (sibling !== avatar) {
          const text = sibling.textContent?.trim();
          if (text && isValidUsername(text)) {
            return text;
          }
        }
      }
    }
  }
  
  // 策略2：查找明确的用户名选择器
  const usernameSelectors = [
    '.user-nickname',
    '[class*="user-nickname"]',
    '.nickname',
    '[class*="nickname"]',
    '[class*="name"]:not([class*="content"]):not([class*="desc"])',
    '.username',
    '[class*="username"]',
    '[data-user-id]'
  ];
  
  for (const selector of usernameSelectors) {
    const el = container.querySelector(selector);
    if (el) {
      const text = el.textContent?.trim();
      if (text && isValidUsername(text)) {
        return text;
      }
    }
  }
  
  // 策略3：查找第一层短文本（用户名通常在上方）
  const layers = getTextLayers(container);
  if (layers.length > 0) {
    const firstLayer = layers[0];
    if (isValidUsername(firstLayer)) {
      return firstLayer;
    }
  }
  
  return null;
}

// 判断是否为有效用户名
function isValidUsername(text) {
  if (!text || text.length < 2 || text.length > 30) return false;
  // 排除操作按钮
  if (text === '分享' || text === '回复' || text === '赞' || text === '评论') return false;
  // 排除纯数字
  if (/^\d+$/.test(text)) return false;
  // 排除占位符
  if (/^[·.。…]+$/.test(text)) return false;
  // 用户名通常不含句号、问号、感叹号
  if (text.includes('。') || text.includes('？') || text.includes('！')) return false;
  return true;
}

// ====================
// 提取评论内容（独立策略）
// 只在评论正文区域查找，显式排除占位符
// ====================
function extractCommentContent(container) {
  // 策略1：查找明确的评论正文选择器（最可靠）
  const contentSelectors = [
    'p.comment-text',
    '.comment-text',
    '[class*="comment-text"]',
    '.content-text',
    '[class*="content-text"]',
    '.desc',
    '[class*="desc"]',
    '.text-content',
    '[class*="text-content"]',
    '[data-e2e="comment-text"]',
    '.comment-content',
    '[class*="comment-content"]'
  ];
  
  for (const selector of contentSelectors) {
    const el = container.querySelector(selector);
    if (el) {
      const text = el.textContent?.trim();
      if (text && isValidComment(text)) {
        return cleanCommentContent(text);
      }
    }
  }
  
  // 策略2：查找aria-label或data-*属性中的完整文本
  const ariaEl = container.querySelector('[aria-label], [data-content], [data-text]');
  if (ariaEl) {
    const text = ariaEl.getAttribute('aria-label') || 
                 ariaEl.getAttribute('data-content') || 
                 ariaEl.getAttribute('data-text');
    if (text && isValidComment(text)) {
      return cleanCommentContent(text);
    }
  }
  
  // 策略3：查找第二层及以后的文本（评论内容通常在用户名下方）
  const layers = getTextLayers(container);
  console.log(`文本层:`, layers);
  
  if (layers.length >= 2) {
    // 跳过第一层（用户名），检查后面的层
    for (let i = 1; i < layers.length; i++) {
      if (isValidComment(layers[i])) {
        return cleanCommentContent(layers[i]);
      }
    }
  }
  
  // 策略4：如果只有一层且是长文本，可能是评论
  if (layers.length === 1 && isValidComment(layers[0])) {
    return cleanCommentContent(layers[0]);
  }
  
  // 策略5：深度DOM探测 - 查找所有可能包含评论的元素
  const allTexts = getAllTextsDeep(container);
  console.log(`深度文本探测:`, allTexts);
  
  // 过滤掉用户名和占位符，找最长的有效文本
  const validTexts = allTexts.filter(t => isValidComment(t));
  if (validTexts.length > 0) {
    // 返回最长的文本（通常是评论内容）并清理
    const longestText = validTexts.reduce((longest, t) => t.length > longest.length ? t : longest, '');
    return cleanCommentContent(longestText);
  }
  
  return null;
}

// 判断是否为有效评论内容
function isValidComment(text) {
  if (!text || text.length < 2) return false;
  // 排除操作按钮
  if (text === '分享' || text === '回复' || text === '赞' || text === '评论') return false;
  // 排除纯数字
  if (/^\d+$/.test(text)) return false;
  // 排除占位符（关键修复！）
  if (/^[·.。…]+$/.test(text)) return false;
  // 排除用户名样式的短文本（不含标点的短文本）
  if (text.length <= 30 && !text.includes('。') && !text.includes('？') && !text.includes('！') && !text.includes('，')) {
    // 但如果包含@、表情等特殊字符，可能是评论
    if (!text.includes('@') && !text.includes('\uD83C') && !text.includes('\uD83D')) {
      return false;
    }
  }
  return true;
}

// 清理评论内容中的操作按钮文本
function cleanCommentContent(text) {
  if (!text) return text;
  
  // 移除操作按钮文本和相关内容
  let cleaned = text
    // 移除"分享"及前后内容
    .replace(/[\u4e00-\u9fa5]+\d+分享回复?/g, '')
    .replace(/分享回复?/g, '')
    .replace(/分享/g, '')
    // 移除"回复"及前后内容
    .replace(/回复\d+条回复/g, '')
    .replace(/回复/g, '')
    // 移除"展开"及后面内容
    .replace(/展开\d+条回复/g, '')
    .replace(/展开/g, '')
    // 移除时间戳（如"3月前"）
    .replace(/\d+月前/g, '')
    .replace(/\d+天前/g, '')
    .replace(/\d+小时前/g, '')
    .replace(/\d+分钟前/g, '')
    // 移除地区信息（如"·辽宁"）
    .replace(/·[\u4e00-\u9fa5]+/g, '')
    // 移除末尾的数字（如"3条"）
    .replace(/\d+条/g, '')
    // 清理多余空格和标点
    .replace(/\s+/g, ' ')
    .replace(/^[·.。…\s]+|[·.。…\s]+$/g, '')
    .trim();
  
  return cleaned;
}

// 获取文本层（按DOM结构分层，用户名在上层，评论在下层）
function getTextLayers(container) {
  const layers = [];
  
  // 方法1：按子元素层级提取
  const children = container.children;
  for (const child of children) {
    const text = child.textContent?.trim();
    if (text && text.length >= 1) {
      // 排除动作区
      if (!text.includes('分享') && !text.includes('回复') && !text.includes('赞')) {
        // 按换行分割
        const parts = text.split(/[\n\r]+/).filter(t => t.trim().length >= 2);
        layers.push(...parts);
      }
    }
  }
  
  // 方法2：如果没有分层，用完整文本分割
  if (layers.length === 0) {
    const fullText = container.textContent?.trim();
    if (fullText) {
      const parts = fullText.split(/[\n\r]{2,}/).filter(t => t.trim().length >= 2);
      layers.push(...parts);
    }
  }
  
  // 方法3：查找所有p/span/div文本
  if (layers.length === 0) {
    const allElements = container.querySelectorAll('p, span, div');
    allElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length >= 2 && !layers.includes(text)) {
        layers.push(text);
      }
    });
  }
  
  return layers;
}

// 深度DOM探测 - 递归查找所有文本节点
function getAllTextsDeep(element) {
  const texts = [];
  
  // 方法1：使用TreeWalker获取所有文本节点
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text && text.length >= 2) {
      texts.push(text);
    }
  }
  
  // 方法2：如果TreeWalker没找到，递归遍历子元素
  if (texts.length === 0) {
    const traverse = (el) => {
      if (el.children.length === 0) {
        const text = el.textContent?.trim();
        if (text && text.length >= 2) {
          texts.push(text);
        }
      } else {
        for (const child of el.children) {
          traverse(child);
        }
      }
    };
    traverse(element);
  }
  
  // 方法3：查找所有可见元素的文本
  if (texts.length === 0) {
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length >= 2 && !texts.includes(text)) {
        texts.push(text);
      }
    });
  }
  
  return texts;
}

// 获取容器内所有文本
function getAllTexts(element) {
  const texts = [];
  
  // 方法1：直接获取textContent并分割
  const fullText = element.textContent?.trim();
  if (fullText) {
    // 按换行、制表符、多个空格分割
    const parts = fullText.split(/[\n\r\t]+| {2,}/).filter(t => t.trim().length >= 1);
    texts.push(...parts);
  }
  
  // 方法2：遍历所有子元素
  const allElements = element.querySelectorAll('span, p, div');
  allElements.forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length >= 1 && !texts.includes(text)) {
      texts.push(text);
    }
  });
  
  return texts;
}

// 生成唯一ID
function generateId(element, content) {
  const timestamp = Date.now().toString(36);
  const contentHash = content.substring(0, 10).split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0).toString(36);
  return `${timestamp}-${contentHash}`;
}

// 检查评论内容
async function checkCommentContent(commentId, content, element, username) {
  // 标记为已检查
  checkedComments.add(commentId);
  stats.total++;
  
  console.log(`[API请求] 用户:"${username || '未知'}", 发送内容审核: "${content.substring(0, 30)}..."`);
  
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        content,
        contentType: 'text',
        username: username || ''
      })
    });
    
    console.log('[API响应] 状态码:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[API结果]', JSON.stringify(data));
    
    if (data.success && data.data) {
      const result = data.data;
      
      if (result.isViolation) {
        stats.filtered++;
        markViolation(element, result.violatedKeywords || []);
        console.log(`✅ 检测到敏感词: ${result.violatedKeywords?.join(', ') || '未知'}`);
      } else {
        stats.passed++;
      }
    }
  } catch (error) {
    stats.pending++;
    console.error('检查评论失败:', error.message);
    // 如果失败，移除已检查标记以便下次重试
    checkedComments.delete(commentId);
    stats.total--;
  }
}

// 标记违规评论
function markViolation(element, keywords) {
  // 添加红色边框
  element.style.border = '2px solid #ff4757';
  element.style.borderRadius = '8px';
  
  // 添加遮罩层
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 71, 87, 0.9);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  overlay.textContent = `⚠️ 已过滤 (包含敏感词: ${keywords.join(', ')})`;
  overlay.style.color = '#fff';
  overlay.style.fontWeight = 'bold';
  overlay.style.fontSize = '14px';
  
  element.style.position = 'relative';
  element.appendChild(overlay);
}

// 获取统计数据（供popup使用）
window.getFilterStats = function() {
  return stats;
};

// 重置统计数据
window.resetFilterStats = function() {
  stats = { total: 0, filtered: 0, passed: 0, pending: 0 };
  checkedComments.clear();
};

// 为popup提供统一的API接口
window.jingwang = {
  getStats: function() {
    console.log('[Popup查询] 返回统计数据:', {
      total: stats.total,
      blocked: stats.filtered,
      approved: stats.passed,
      pending: stats.pending
    });
    return {
      total: stats.total,
      blocked: stats.filtered,
      approved: stats.passed,
      pending: stats.pending
    };
  },
  resetStats: function() {
    console.log('[Popup指令] 重置统计数据');
    stats = { total: 0, filtered: 0, passed: 0, pending: 0 };
    checkedComments.clear();
  },
  getVersion: function() {
    return '1.3.0';
  }
};

console.log('=== window.jingwang 已注册 ===');
console.log('可用方法:', Object.keys(window.jingwang));

// 测试函数 - 供popup调用验证插件是否正常工作
window.testPlugin = function() {
  console.log('[测试] 插件测试开始...');
  
  const testResult = {
    version: '1.3.0',
    stats: stats,
    checkedCommentsCount: checkedComments.size,
    isReady: true,
    currentUrl: window.location.href
  };
  
  console.log('[测试] 插件状态:', testResult);
  return testResult;
};

// 定时检查
setInterval(checkComments, CONFIG.CHECK_INTERVAL);

// 页面加载完成后立即检查一次
setTimeout(checkComments, 1000);

console.log('=== 开始监控评论... ===');
console.log('当前页面:', window.location.href);
