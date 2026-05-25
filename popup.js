// 刷新统计信息
const refreshStats = () => {
  // 检查后端服务状态
  fetch('http://localhost:3000/api/moderation/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: '测试',
      contentType: 'text'
    })
  })
  .then(response => {
    console.log('响应状态:', response.status);
    if (response.ok) {
      document.getElementById('statusIndicator').className = 'status-indicator status-online';
      document.getElementById('statusText').textContent = '后端服务在线';
      return response.json();
    } else {
      throw new Error('服务响应失败: ' + response.status);
    }
  })
  .then(data => {
    console.log('API响应数据:', data);
  })
  .catch(error => {
    console.error('连接后端服务失败:', error);
    document.getElementById('statusIndicator').className = 'status-indicator status-offline';
    document.getElementById('statusText').textContent = '后端服务离线';
  });
  
  // 获取统计信息
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
    console.log('获取统计信息响应:', response);
    if (response && response.success && response.data) {
      document.getElementById('totalCount').textContent = response.data.total || 0;
      document.getElementById('blockedCount').textContent = response.data.blocked || 0;
      document.getElementById('approvedCount').textContent = response.data.approved || 0;
      document.getElementById('pendingCount').textContent = response.data.pending || 0;
    } else {
      console.log('获取统计信息失败或数据为空');
    }
  });
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  refreshStats();
  
  // 绑定刷新按钮事件
  document.getElementById('refreshBtn').addEventListener('click', refreshStats);
  
  // 每5秒自动刷新
  setInterval(refreshStats, 5000);
});
