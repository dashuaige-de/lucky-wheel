// 检测是否在微信浏览器中运行
function isWeixinBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('micromessenger') !== -1;
}

// 全局语音播报函数
function speakResult(text, isTest = false) {
    const message = isTest ? "语音测试：这是一条测试语音" : `恭喜！抽中了：${text}`;
    
    // 在微信浏览器中使用alert作为替代方案
    if (isWeixinBrowser()) {
        if (isTest) {
            alert('微信浏览器中语音播报可能受限，但功能正常。');
        } else {
            // 在微信中只显示结果，不进行语音播报
            alert(message);
        }
        return;
    }
    
    // 在其他浏览器中使用语音合成API
    if ('speechSynthesis' in window) {
        // 创建语音合成实例
        const utterance = new SpeechSynthesisUtterance();
        
        // 设置语音内容和语言
        utterance.text = message;
        utterance.lang = 'zh-CN'; // 设置为中文
        utterance.rate = 1.0;  // 语速
        utterance.pitch = 1.0; // 音调
        utterance.volume = 1.0; // 音量
        
        // 获取可用的语音
        let voices = window.speechSynthesis.getVoices();
        
        // 如果voices为空，等待voiceschanged事件
        if (voices.length === 0) {
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                voices = window.speechSynthesis.getVoices();
                setVoice();
            });
        } else {
            setVoice();
        }
        
        function setVoice() {
            // 尝试找到中文语音
            const chineseVoice = voices.find(voice => 
                voice.lang.includes('zh') || 
                voice.lang.includes('cmn') || 
                voice.name.includes('Chinese')
            );
            
            // 如果找到中文语音，则使用它
            if (chineseVoice) {
                utterance.voice = chineseVoice;
            }
            
            // 播放语音
            window.speechSynthesis.speak(utterance);
        }
    } else {
        if (isTest) {
            alert('抱歉，您的浏览器不支持语音合成功能。');
        } else {
            // 如果不支持语音合成，则使用alert显示结果
            alert(message);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const wheel = document.querySelector('.wheel');
    const spinBtn = document.getElementById('spinBtn');
    const testVoiceBtn = document.getElementById('testVoiceBtn');
    const wheelItems = document.querySelectorAll('.wheel-item span');
    
    // 默认选项
    let options = [
        '选项1', '选项2', '选项3', '选项4', 
        '选项5', '选项6', '选项7', '选项8'
    ];
    
    // 从本地存储加载自定义选项
    if (localStorage.getItem('wheelOptions')) {
        options = JSON.parse(localStorage.getItem('wheelOptions'));
        updateWheelOptions();
    }
    
    // 旋转状态
    let isSpinning = false;
    
    // 测试语音按钮点击事件
    testVoiceBtn.addEventListener('click', function() {
        speakResult('', true);
    });
    
    // 点击旋转按钮
    spinBtn.addEventListener('click', function() {
        if (isSpinning) return;
        
        // 禁用按钮
        spinBtn.disabled = true;
        isSpinning = true;
        
        // 随机选择一个选项 (0-7)
        const selectedIndex = Math.floor(Math.random() * 8);
        
        // 计算旋转角度 (多转几圈再停在选中的选项)
        // 注意：由于转盘的设计，我们需要调整角度计算
        // 每个选项占45度，指针指向顶部，所以需要调整角度
        const extraRotations = 5; // 额外旋转的圈数
        const baseAngle = selectedIndex * 45; // 每个选项45度
        const targetAngle = 360 * extraRotations + (360 - baseAngle - 22.5); // 调整角度使指针指向选中选项中心
        
        // 设置转盘旋转
        wheel.style.transform = `rotate(${targetAngle}deg)`;
        
        // 旋转结束后
        setTimeout(() => {
            const result = options[selectedIndex];
            
            // 显示结果
            alert(`恭喜！抽中了：${result}`);
            
            // 语音播报结果
            speakResult(result);
            
            // 重置状态
            spinBtn.disabled = false;
            isSpinning = false;
        }, 5000); // 与CSS中的transition时间一致
    });
    
    // 添加双击事件来编辑选项
    wheel.addEventListener('dblclick', function() {
        if (isSpinning) return;
        
        // 提示用户输入新的选项
        const newOptions = prompt('请输入8个选项，用逗号分隔:', options.join(','));
        
        if (newOptions) {
            const optionsArray = newOptions.split(',').map(item => item.trim());
            
            // 确保有8个选项
            if (optionsArray.length !== 8) {
                alert('请确保输入8个选项！');
                return;
            }
            
            // 更新选项
            options = optionsArray;
            
            // 保存到本地存储
            localStorage.setItem('wheelOptions', JSON.stringify(options));
            
            // 更新转盘上的选项文本
            updateWheelOptions();
        }
    });
    
    // 添加长按事件来重置选项（移动设备友好）
    let pressTimer;
    
    wheel.addEventListener('touchstart', function() {
        if (isSpinning) return;
        
        pressTimer = setTimeout(function() {
            resetOptions();
        }, 1500); // 长按1.5秒
    });
    
    wheel.addEventListener('touchend', function() {
        clearTimeout(pressTimer);
    });
    
    // 添加重置按钮功能
    function resetOptions() {
        const confirmed = confirm('是否要重置所有选项？');
        if (confirmed) {
            options = ['选项1', '选项2', '选项3', '选项4', '选项5', '选项6', '选项7', '选项8'];
            localStorage.removeItem('wheelOptions');
            updateWheelOptions();
            alert('选项已重置！');
        }
    }
    
    // 更新转盘上的选项文本
    function updateWheelOptions() {
        wheelItems.forEach((item, index) => {
            item.textContent = options[index];
        });
    }
    
    // 添加帮助提示
    const container = document.querySelector('.container');
    const helpText = document.createElement('p');
    helpText.className = 'help-text';
    helpText.innerHTML = '提示：双击转盘可编辑选项，长按转盘可重置选项';
    helpText.style.textAlign = 'center';
    helpText.style.marginTop = '10px';
    helpText.style.fontSize = '14px';
    helpText.style.color = '#666';
    container.appendChild(helpText);
    
    // 注册Service Worker以实现离线功能（在非微信浏览器中）
    if ('serviceWorker' in navigator && !isWeixinBrowser()) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        });
    }
});