// 净网守护 - 后台服务
console.log('=== 净网守护后台服务启动 ===');

const defaultStats = { total: 0, blocked: 0, approved: 0, pending: 0 };
let stats = { ...defaultStats };

// 从 storage 恢复统计数据
chrome.storage.local.get('stats', (result) => {
  if (result.stats) {
    stats = { ...defaultStats, ...result.stats };
    console.log('已恢复统计数据:', stats);
  }
});

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展已安装');
  chrome.storage.local.set({ stats: defaultStats });
});

// 监听消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('收到消息:', msg.type);
  
  if (msg.type === 'CHECK_COMMENT') {
    // 发送内容到后端 API 进行检查
    fetch('http://localhost:3000/api/moderation/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ content: msg.content, contentType: 'text' })
    })
    .then(res => res.json())
    .then(data => {
      stats.total++;
      if (data.success && data.data?.isViolation) {
        stats.blocked++;
      } else {
        stats.approved++;
      }
      chrome.storage.local.set({ stats });
      sendResponse({ success: true, data: data.data });
    })
    .catch(err => {
      console.error('API 调用失败:', err);
      stats.pending++;
      chrome.storage.local.set({ stats });
      sendResponse({ success: false, error: err.message });
    });
    return true; // 保持消息通道开启以发送异步响应
    
  } else if (msg.type === 'GET_STATS') {
    chrome.storage.local.get('stats', (result) => {
      sendResponse({ success: true, data: result.stats || stats });
    });
    return true;
    
  } else if (msg.type === 'RESET_STATS') {
    stats = { ...defaultStats };
    chrome.storage.local.set({ stats });
    sendResponse({ success: true });
    return true;
  }
});

// 保持 Service Worker 活跃
setInterval(() => {
  console.log('后台服务运行中...');
}, 30000);

console.log('=== 净网守护后台服务初始化完成 ===');
