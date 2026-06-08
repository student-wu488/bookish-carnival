// 净网守护 - Popup 脚本
console.log('=== 净网守护 Popup 已加载 ===');

// 检查后端服务状态
async function checkBackendStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/moderation/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ content: 'test', contentType: 'text' })
    });
    
    if (response.ok) {
      updateStatus(true);
    } else {
      updateStatus(false);
    }
  } catch (error) {
    console.error('后端服务不可达:', error);
    updateStatus(false);
  }
}

// 更新状态显示
function updateStatus(isOnline) {
  const indicator = document.getElementById('statusIndicator');
  const text = document.getElementById('statusText');
  
  if (isOnline) {
    indicator.className = 'status-indicator';
    text.textContent = '后端服务在线';
    text.style.color = '#94a3b8';
  } else {
    indicator.className = 'status-indicator offline';
    text.textContent = '后端服务离线';
    text.style.color = '#f44336';
  }
}

// 更新统计数据
async function updateStats() {
  try {
    console.log('[Popup] 开始获取统计数据...');
    
    // 尝试从页面获取统计数据
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    console.log('[Popup] 找到标签页:', tabs.length);
    
    if (tabs.length > 0) {
      const tab = tabs[0];
      console.log('[Popup] 当前标签页:', tab.url);
      
      // 检查是否是抖音页面
      if (!tab.url.includes('douyin.com')) {
        console.log('[Popup] 非抖音页面，跳过');
        document.getElementById('totalCount').textContent = '-';
        document.getElementById('blockedCount').textContent = '-';
        document.getElementById('approvedCount').textContent = '-';
        document.getElementById('pendingCount').textContent = '-';
        return;
      }
      
      try {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            // 从页面的 window.jingwang 对象获取统计数据
            console.log('[Content] popup请求统计数据');
            
            if (window.jingwang && typeof window.jingwang.getStats === 'function') {
              return window.jingwang.getStats();
            }
            
            // 如果 jingwang 不存在，尝试其他方法
            if (window.getFilterStats) {
              const stats = window.getFilterStats();
              return {
                total: stats.total,
                blocked: stats.filtered,
                approved: stats.passed,
                pending: stats.pending
              };
            }
            
            console.log('[Content] 未找到统计数据接口');
            return null;
          }
        });
        
        console.log('[Popup] 执行结果:', result);
        
        if (result && result[0] && result[0].result) {
          const stats = result[0].result;
          console.log('[Popup] 获取到统计数据:', stats);
          
          document.getElementById('totalCount').textContent = stats.total || 0;
          document.getElementById('blockedCount').textContent = stats.blocked || 0;
          document.getElementById('approvedCount').textContent = stats.approved || 0;
          document.getElementById('pendingCount').textContent = stats.pending || 0;
          return;
        } else {
          console.log('[Popup] 未获取到数据');
        }
      } catch (scriptError) {
        console.error('[Popup] 脚本执行失败:', scriptError);
      }
    }
    
    // 如果无法从页面获取，显示默认值
    document.getElementById('totalCount').textContent = 0;
    document.getElementById('blockedCount').textContent = 0;
    document.getElementById('approvedCount').textContent = 0;
    document.getElementById('pendingCount').textContent = 0;
    
  } catch (error) {
    console.error('[Popup] 获取统计数据失败:', error);
    document.getElementById('totalCount').textContent = 0;
    document.getElementById('blockedCount').textContent = 0;
    document.getElementById('approvedCount').textContent = 0;
    document.getElementById('pendingCount').textContent = 0;
  }
}

// 重置统计数据
async function resetStats() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length > 0) {
      await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          if (window.jingwang && typeof window.jingwang.resetStats === 'function') {
            window.jingwang.resetStats();
          }
        }
      });
    }
    
    updateStats();
  } catch (error) {
    console.error('重置统计数据失败:', error);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup 初始化...');
  
  // 检查后端状态
  checkBackendStatus();
  
  // 更新统计数据
  updateStats();
  
  // 绑定重置按钮事件
  document.getElementById('resetBtn').addEventListener('click', resetStats);
  
  // 每 3 秒刷新一次统计数据
  setInterval(updateStats, 3000);
});