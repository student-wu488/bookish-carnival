// 默认统计信息
const defaultStats = {
  total: 0,
  blocked: 0,
  pending: 0,
  approved: 0
};

// 存储审核统计信息（从storage读取初始化）
let stats = { ...defaultStats };

// 初始化时从storage读取统计数据
chrome.storage.local.get('stats', (result) => {
  if (result.stats) {
    stats = { ...defaultStats, ...result.stats };
    console.log('从storage加载统计数据:', stats);
  }
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_COMMENT') {
    console.log('收到评论内容:', message.content);
    // 调用净网守护系统API
    fetch('http://localhost:3000/api/moderation/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        content: message.content,
        contentType: 'text'
      })
    })
    .then(response => {
      console.log('API响应状态:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('API响应数据:', data);
      stats.total++;
      if (data.success) {
        if (data.data.isViolation) {
          stats.blocked++;
        } else {
          stats.approved++;
        }
      } else {
        stats.pending++;
      }
      // 保存统计信息
      chrome.storage.local.set({ stats });
      // 发送审核结果
      sendResponse({
        success: true,
        data: data.data
      });
    })
    .catch(error => {
      console.error('API调用失败:', error);
      stats.pending++;
      chrome.storage.local.set({ stats });
      sendResponse({
        success: false,
        error: 'API调用失败'
      });
    });
    return true; // 表示异步响应
  } else if (message.type === 'GET_STATS') {
    // 发送统计信息
    chrome.storage.local.get('stats', (result) => {
      sendResponse({
        success: true,
        data: result.stats || stats
      });
    });
    return true; // 表示异步响应
  }
});
