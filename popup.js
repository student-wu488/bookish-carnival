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
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_STATS' }, (result) => {
        resolve(result);
      });
    });
    
    if (response && response.success && response.data) {
      const stats = response.data;
      document.getElementById('totalCount').textContent = stats.total || 0;
      document.getElementById('blockedCount').textContent = stats.blocked || 0;
      document.getElementById('approvedCount').textContent = stats.approved || 0;
      document.getElementById('pendingCount').textContent = stats.pending || 0;
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
}

// 重置统计数据
function resetStats() {
  chrome.runtime.sendMessage({ type: 'RESET_STATS' }, (response) => {
    if (response && response.success) {
      updateStats();
    }
  });
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
