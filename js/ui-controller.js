// UI控制器模块 - 双上传版本

class UIController {
    constructor() {
        this.currentPage = 'disguise';
        this.targetFile = null;
        this.coverImage = null;
        this.elements = this.cacheElements();
        this.initializeEventListeners();
    }

    // 缓存DOM元素
    cacheElements() {
        return {
            // 导航
            navButtons: document.querySelectorAll('.nav-btn'),
            pagesSections: document.querySelectorAll('.page-section'),
            
            // 目标文件上传
            targetFileArea: document.getElementById('targetFileArea'),
            targetFileInput: document.getElementById('targetFileInput'),
            selectTargetBtn: document.getElementById('selectTargetBtn'),
            targetFilePreview: document.getElementById('targetFilePreview'),
            targetFileName: document.getElementById('targetFileName'),
            targetFileSize: document.getElementById('targetFileSize'),
            removeTargetBtn: document.getElementById('removeTargetBtn'),
            
            // 封面图片上传
            coverImageArea: document.getElementById('coverImageArea'),
            coverImageInput: document.getElementById('coverImageInput'),
            selectCoverBtn: document.getElementById('selectCoverBtn'),
            coverImagePreview: document.getElementById('coverImagePreview'),
            coverImageThumbnail: document.getElementById('coverImageThumbnail'),
            removeCoverBtn: document.getElementById('removeCoverBtn'),
            
            // 设置和处理
            outputFormat: document.getElementById('outputFormat'),
            processBtn: document.getElementById('processBtn'),
            clearBtn: document.getElementById('clearBtn'),
            
            // 批量处理
            batchUpload: document.getElementById('batchUpload'),
            batchSelectBtn: document.getElementById('batchSelectBtn'),
            batchProgress: document.getElementById('batchProgress'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            // 历史记录
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            exportHistoryBtn: document.getElementById('exportHistoryBtn'),
            
            // 主题
            themeToggle: document.getElementById('themeToggle')
        };
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 导航切换
        this.elements.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPage(e.target.dataset.page));
        });

        // 目标文件上传
        this.elements.selectTargetBtn.addEventListener('click', () => {
            this.elements.targetFileInput.click();
        });

        this.elements.targetFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleTargetFileSelect(e.target.files[0]);
            }
        });

        this.elements.removeTargetBtn.addEventListener('click', () => {
            this.clearTargetFile();
        });

        // 封面图片上传
        this.elements.selectCoverBtn.addEventListener('click', () => {
            this.elements.coverImageInput.click();
        });

        this.elements.coverImageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleCoverImageSelect(e.target.files[0]);
            }
        });

        this.elements.removeCoverBtn.addEventListener('click', () => {
            this.clearCoverImage();
        });

        // 处理按钮
        this.elements.processBtn.addEventListener('click', () => this.processFiles());
        this.elements.clearBtn.addEventListener('click', () => this.clearAll());

        // 拖拽支持
        this.setupDragDrop();

        // 批量处理
        if (this.elements.batchSelectBtn) {
            this.elements.batchSelectBtn.addEventListener('click', () => this.handleBatchSelect());
        }

        // 历史记录
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
        if (this.elements.exportHistoryBtn) {
            this.elements.exportHistoryBtn.addEventListener('click', () => this.exportHistory());
        }

        // 主题切换
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    // 处理目标文件选择
    handleTargetFileSelect(file) {
        // 验证文件
        const validation = window.fileHandler.validateFile(file);
        if (!validation.valid) {
            Utils.showToast(validation.error, 'error');
            return;
        }

        this.targetFile = file;
        
        // 更新预览
        this.elements.targetFileName.textContent = file.name;
        this.elements.targetFileSize.textContent = Utils.formatFileSize(file.size);
        this.elements.targetFilePreview.style.display = 'block';
        this.elements.targetFileArea.style.display = 'none';

        this.updateProcessButton();
        Utils.showToast('文件已选择', 'success');
    }

    // 处理封面图片选择
    async handleCoverImageSelect(file) {
        // 验证是否是图片
        if (!file.type.startsWith('image/')) {
            Utils.showToast('请选择图片文件', 'error');
            return;
        }

        this.coverImage = file;
        
        // 显示图片预览
        try {
            const dataUrl = await Utils.readFileAsDataURL(file);
            this.elements.coverImageThumbnail.src = dataUrl;
            this.elements.coverImagePreview.style.display = 'block';
            this.elements.coverImageArea.style.display = 'none';

            this.updateProcessButton();
            Utils.showToast('封面图片已选择', 'success');
        } catch (error) {
            Utils.showToast('图片加载失败', 'error');
        }
    }

    // 更新处理按钮状态
    updateProcessButton() {
        const canProcess = this.targetFile && this.coverImage;
        this.elements.processBtn.disabled = !canProcess;
    }

    // 清除目标文件
    clearTargetFile() {
        this.targetFile = null;
        this.elements.targetFileInput.value = '';
        this.elements.targetFilePreview.style.display = 'none';
        this.elements.targetFileArea.style.display = 'block';
        this.updateProcessButton();
    }

    // 清除封面图片
    clearCoverImage() {
        this.coverImage = null;
        this.elements.coverImageInput.value = '';
        this.elements.coverImagePreview.style.display = 'none';
        this.elements.coverImageArea.style.display = 'block';
        this.elements.coverImageThumbnail.src = '';
        this.updateProcessButton();
    }

    // 清除所有
    clearAll() {
        this.clearTargetFile();
        this.clearCoverImage();
        Utils.showToast('已清除所有文件', 'info');
    }

    // 处理文件
    async processFiles() {
        if (!this.targetFile || !this.coverImage) {
            Utils.showToast('请先选择要伪装的文件和封面图片', 'warning');
            return;
        }

        Utils.showLoading(true, '正在处理文件...');

        try {
            const outputFormat = this.elements.outputFormat.value;
            
            // 执行伪装
            const result = await window.disguiseEngine.disguiseFile(
                this.targetFile,
                this.coverImage,
                outputFormat
            );

            // 自动下载
            Utils.downloadFile(result.blob, result.name);

            // 添加到历史
            window.historyManager.addRecord(this.targetFile, result);

            Utils.showLoading(false);
            
            // 显示使用说明
            Utils.showToast('✅ 处理成功！文件名包含使用提示，按提示改名即可使用', 'success', 6000);
            
            setTimeout(() => {
                if (confirm('✅ 文件处理完成并已下载！\n\n📌 使用方法：\n1. 找到下载的文件\n2. 将文件扩展名改为文件名中提示的格式\n3. 改名后即可正常使用\n\n示例：\nmyfile_[改名为.zip].jpg → 改为 → myfile.zip\n\n是否清空当前文件，继续处理其他文件？')) {
                    this.clearAll();
                }
            }, 1000);

        } catch (error) {
            console.error('处理文件失败:', error);
            Utils.showLoading(false);
            Utils.showToast('处理失败：' + (error.message || '未知错误'), 'error');
            window.historyManager.addFailureRecord(this.targetFile, error);
        }
    }

    // 设置拖拽功能
    setupDragDrop() {
        // 目标文件拖拽
        const targetArea = this.elements.targetFileArea;
        if (targetArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                targetArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                targetArea.addEventListener(eventName, () => {
                    targetArea.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                targetArea.addEventListener(eventName, () => {
                    targetArea.classList.remove('dragover');
                }, false);
            });

            targetArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleTargetFileSelect(files[0]);
                }
            }, false);
        }

        // 封面图片拖拽
        const coverArea = this.elements.coverImageArea;
        if (coverArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                coverArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                coverArea.addEventListener(eventName, () => {
                    coverArea.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                coverArea.addEventListener(eventName, () => {
                    coverArea.classList.remove('dragover');
                }, false);
            });

            coverArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleCoverImageSelect(files[0]);
                }
            }, false);
        }
    }

    // 页面切换
    switchPage(pageName) {
        if (!pageName || this.currentPage === pageName) return;

        this.elements.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageName);
        });

        this.elements.pagesSections.forEach(section => {
            section.style.display = section.id === `${pageName}Page` ? 'block' : 'none';
            section.classList.toggle('active', section.id === `${pageName}Page`);
        });

        this.currentPage = pageName;

        if (pageName === 'history') {
            this.loadHistory();
        }
    }

    // 批量处理
    handleBatchSelect() {
        Utils.showToast('批量处理功能开发中...', 'info');
    }

    // 加载历史记录
    loadHistory() {
        const history = window.historyManager.getHistory();
        this.elements.historyList.innerHTML = '';

        if (history.length === 0) {
            this.elements.historyList.innerHTML = '<p class="empty-message">暂无处理记录</p>';
            return;
        }

        history.forEach(record => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-info">
                    <div class="history-name">${record.originalName} → ${record.disguisedName || '失败'}</div>
                    <div class="history-meta">
                        ${Utils.formatFileSize(record.originalSize)} → ${record.disguisedSize ? Utils.formatFileSize(record.disguisedSize) : '-'}
                        <span class="history-date">${Utils.formatDate(record.timestamp)}</span>
                        ${record.success ? '<span style="color: green;">✓</span>' : '<span style="color: red;">✗</span>'}
                    </div>
                </div>
            `;
            this.elements.historyList.appendChild(item);
        });
    }

    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            window.historyManager.clearHistory();
            this.loadHistory();
            Utils.showToast('历史记录已清空', 'success');
        }
    }

    // 导出历史记录
    exportHistory() {
        const history = window.historyManager.getHistory();
        if (history.length === 0) {
            Utils.showToast('暂无历史记录可导出', 'warning');
            return;
        }

        const data = JSON.stringify(history, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const filename = `disguise_history_${Date.now()}.json`;
        
        Utils.downloadFile(blob, filename);
        Utils.showToast('历史记录已导出', 'success');
    }

    // 切换主题
    toggleTheme() {
        if (window.themeController) {
            window.themeController.toggleTheme();
        }
    }
}

// 创建全局UI控制器实例
window.uiController = new UIController();