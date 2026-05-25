// 净网守护 - 抖音评论过滤内容脚本

console.log('=== 净网守护扩展已加载 ===');

// 简化的评论检测函数
const detectComments = () => {
  console.log('开始检测评论...');
  
  // 获取页面上所有包含文本的元素
  const allElements = document.querySelectorAll('div, span, p');
  
  for (const element of allElements) {
    const text = element.textContent?.trim();
    if (text && text.length > 0 && text.length < 500) {
      // 发送评论内容到后台脚本进行审核
      chrome.runtime.sendMessage({
        type: 'CHECK_COMMENT',
        content: text
      }, (response) => {
        if (response && response.success && response.data && response.data.isViolation) {
          console.log('发现违规内容:', text);
          // 屏蔽违规评论
          blockComment(element);
        }
      });
    }
  }
  
  console.log('评论检测完成');
};

// 屏蔽违规评论
const blockComment = (element) => {
  // 创建屏蔽覆盖层
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.background = 'rgba(0, 0, 0, 0.7)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.borderRadius = '8px';
  overlay.style.zIndex = '1000';
  overlay.innerHTML = `
    <div style="text-align: center; color: #fff;">
      <div style="font-size: 14px; margin-bottom: 8px;">[净网守护]</div>
      <div style="font-size: 12px; opacity: 0.8;">该评论包含违规内容</div>
    </div>
  `;
  
  // 设置元素为相对定位
  element.style.position = 'relative';
  // 添加屏蔽覆盖层
  element.appendChild(overlay);
  
  console.log('已屏蔽违规评论');
};

// 页面加载完成后开始检测
window.addEventListener('load', () => {
  console.log('页面加载完成');
  setTimeout(detectComments, 3000);
});

// 定期检测新评论
setInterval(detectComments, 5000);
