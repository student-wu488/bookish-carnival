// 净网守护 - 抖音评论过滤插件
console.log('=== 净网守护插件已加载 ===');

// 设置全局标志，供外部检测
window.jingwangLoaded = true;

// 配置
const CONFIG = {
  API_URL: 'http://localhost:3000/api/moderation/check',
  CHECK_INTERVAL: 1000, // 检查间隔（毫秒）
  MAX_CHECKED: 100, // 最多检查的评论数
};

// 统计数据
let stats = {
  total: 0,
  blocked: 0,
  approved: 0,
  pending: 0
};

// 已检查的评论 ID
const checkedComments = new Set();

// 初始化
function init() {
  console.log('净网守护初始化...');
  
  // 从 storage 恢复统计数据
  chrome.storage.local.get(['stats', 'checkedComments'], (result) => {
    if (result.stats) {
      stats = { ...stats, ...result.stats };
    }
    if (result.checkedComments) {
      result.checkedComments.forEach(id => checkedComments.add(id));
    }
    console.log('已恢复统计数据:', stats);
  });
  
  // 开始监控评论
  startMonitoring();
  
  // 监听后台消息
  chrome.runtime.onMessage.addListener(handleMessage);
}

// 处理后台消息
function handleMessage(msg, sender, sendResponse) {
  if (msg.type === 'GET_STATS') {
    sendResponse({ success: true, data: stats });
  } else if (msg.type === 'RESET_STATS') {
    stats = { total: 0, blocked: 0, approved: 0, pending: 0 };
    checkedComments.clear();
    chrome.storage.local.set({ stats, checkedComments: Array.from(checkedComments) });
    sendResponse({ success: true });
  }
  return true;
}

// 开始监控评论
function startMonitoring() {
  console.log('开始监控评论...');
  
  // 初始检查
  checkComments();
  
  // 定期检查新评论
  setInterval(checkComments, CONFIG.CHECK_INTERVAL);
  
  // 监听 DOM 变化
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }
    if (shouldCheck) {
      checkComments();
    }
  });
  
  // 观察评论区域
  observeCommentSections(observer);
}

// 观察评论区域
function observeCommentSections(observer) {
  // 抖音网页版评论选择器（增加更多选择器）
  const selectors = [
    '.comment-list',
    '.comment-item',
    '.douyin-comment',
    '[data-e2e="comment"]',
    '.comment-container',
    '.webcast-chatroom',
    '.live-chat-list',
    '.ChatRoom',
    '.message-list',
    '.comment-list-container',
    '.video-comments',
    '[class*="comment"]',
    '[class*="Comment"]'
  ];
  
  // 尝试找到评论区域
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      observer.observe(element, { childList: true, subtree: true });
      console.log('已监控评论区域:', selector);
      return;
    }
  }
  
  // 如果没有找到，观察整个文档
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('监控整个文档');
}

// 检查评论
function checkComments() {
  // 抖音网页版评论文本选择器（增加更多选择器）
  const commentSelectors = [
    '.comment-text',
    '.comment-content',
    '.text',
    '[data-e2e="comment-text"]',
    '.comment-item .text',
    '.webcast-chatroom-item',
    '.live-chat-item',
    '.message-item',
    '.chat-item',
    '[class*="comment-item"]',
    '[class*="CommentItem"]',
    '.content',
    '.msg-content',
    '.comment-content-text'
  ];
  
  let foundCount = 0;
  console.log('=== 开始检查评论 ===');
  
  for (const selector of commentSelectors) {
    const comments = document.querySelectorAll(selector);
    console.log(`选择器 "${selector}" 找到 ${comments.length} 个元素`);
    
    comments.forEach((commentEl) => {
      if (foundCount >= CONFIG.MAX_CHECKED) return;
      
      const commentId = getCommentId(commentEl);
      const commentText = commentEl.textContent?.trim();
      
      console.log(`找到评论片段: "${commentText?.substring(0, 30)}..."`);
      
      if (!commentId || !commentText) {
        console.log('跳过：ID或文本为空');
        return;
      }
      
      // 如果已经检查过，跳过
      if (checkedComments.has(commentId)) {
        console.log('跳过：已检查过');
        return;
      }
      
      foundCount++;
      console.log(`检查评论 #${foundCount}: ${commentText}`);
      
      // 检查评论
      checkCommentContent(commentId, commentText, commentEl);
    });
  }
  
  console.log(`=== 检查完成，共处理 ${foundCount} 条新评论 ===`);
}

// 获取评论 ID
function getCommentId(element) {
  // 尝试从元素获取 ID
  const id = element.getAttribute('data-comment-id') || 
             element.getAttribute('data-e2e') ||
             element.id ||
             `comment-${Date.now()}-${Math.random()}`;
  return id;
}

// 检查评论内容
async function checkCommentContent(commentId, content, element) {
  console.log('检查评论:', content);
  
  // 标记为已检查
  checkedComments.add(commentId);
  stats.total++;
  
  try {
    // 发送消息到后台服务
    chrome.runtime.sendMessage(
      { type: 'CHECK_COMMENT', content, contentType: 'text' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('发送消息失败:', chrome.runtime.lastError);
          stats.pending++;
          return;
        }
        
        if (response && response.success && response.data) {
          handleCheckResult(commentId, response.data, element);
        } else {
          stats.pending++;
        }
        
        // 保存统计数据
        saveStats();
      }
    );
  } catch (error) {
    console.error('检查评论失败:', error);
    stats.pending++;
    saveStats();
  }
}

// 处理检查结果
function handleCheckResult(commentId, result, element) {
  if (result.isViolation) {
    stats.blocked++;
    // 标记违规评论
    markCommentAsViolation(element, result);
  } else {
    stats.approved++;
  }
  
  console.log('检查结果:', result);
}

// 标记违规评论
function markCommentAsViolation(element, result) {
  // 添加样式
  element.style.backgroundColor = 'rgba(255, 77, 109, 0.1)';
  element.style.border = '1px solid rgba(255, 77, 109, 0.3)';
  element.style.borderRadius = '4px';
  element.style.padding = '4px 8px';
  
  // 添加标记
  const badge = document.createElement('span');
  badge.className = 'jingwang-badge';
  badge.textContent = '⚠️ 已过滤';
  badge.style.cssText = `
    display: inline-block;
    margin-left: 8px;
    padding: 2px 6px;
    font-size: 12px;
    color: #FF4D6D;
    background: rgba(255, 77, 109, 0.1);
    border: 1px solid rgba(255, 77, 109, 0.3);
    border-radius: 4px;
  `;
  
  element.parentNode?.appendChild(badge);
  
  // 可选：隐藏评论
  // element.style.display = 'none';
}

// 保存统计数据
function saveStats() {
  chrome.storage.local.set({ 
    stats, 
    checkedComments: Array.from(checkedComments) 
  });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('=== 净网守护初始化完成 ===');
