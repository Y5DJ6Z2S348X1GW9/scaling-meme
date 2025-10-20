// UI控制器模块

class UIController {
    constructor() {
        this.currentPage = 'disguise';
        this.elements = this.cacheElements();
        this.initializeEventListeners();
    }

    // 缓存DOM元素
    cacheElements() {
        return {
            // 导航
            navButtons: document.querySelectorAll('.nav-btn'),
            pagesSections: document.querySelectorAll('.page-section'),
            
            // 伪装页面
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            selectFileBtn: document.getElementById('selectFileBtn'),
            fileList: document.getElementById('fileList'),
            fileItems: document.getElementById('fileItems'),
            processBtn: document.getElementById('processBtn'),
            clearBtn: document.getElementById('clearBtn'),
            
            // 设置
            disguiseImageSelect: document.getElementById('disguiseImageSelect'),
            customImageInput: document.getElementById('customImageInput'),
            outputFormat: document.getElementById('outputFormat'),
            
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
            themeToggle: document.getElementById('themeToggle'),
            
            // 提示和加载
            toast: document.getElementById('toast'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 导航切换
        this.elements.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPage(e.target.dataset.page));
        });

        // 文件选择
        this.elements.selectFileBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
            e.target.value = ''; // 清空input以允许重复选择
        });

        // 处理和清空按钮
        this.elements.processBtn.addEventListener('click', () => this.processFiles());
        this.elements.clearBtn.addEventListener('click', () => this.clearFileList());

        // 设置变更
        this.elements.disguiseImageSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                this.elements.customImageInput.click();
            }
        });

        this.elements.customImageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                Utils.showToast('已选择自定义图片', 'success');
            } else {
                this.elements.disguiseImageSelect.value = 'default';
            }
        });

        // 批量处理
        this.elements.batchSelectBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.webkitdirectory = true;
            input.addEventListener('change', (e) => this.handleBatchSelect(e.target.files));
            input.click();
        });

        // 历史记录
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.elements.exportHistoryBtn.addEventListener('click', () => this.exportHistory());

        // 主题切换
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // 页面切换
    switchPage(pageName) {
        if (!pageName || this.currentPage === pageName) return;

        // 更新导航按钮状态
        this.elements.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageName);
        });

        // 切换页面显示
        this.elements.pagesSections.forEach(section => {
            section.style.display = section.id === `${pageName}Page` ? 'block' : 'none';
            section.classList.toggle('active', section.id === `${pageName}Page`);
        });

        this.currentPage = pageName;

        // 页面特定的初始化
        if (pageName === 'history') {
            this.loadHistory();
        }
    }

    // 处理文件选择
    handleFileSelect(files) {
        if (!files || files.length === 0) return;

        const addedFiles = window.fileHandler.addFiles(files);
        this.updateFileList();

        const validFiles = addedFiles.filter(f => f.status !== 'error').length;
        const errorFiles = addedFiles.filter(f => f.status === 'error').length;

        if (validFiles > 0) {
            Utils.showToast(`已添加 ${validFiles} 个文件`, 'success');
        }
        
        if (errorFiles > 0) {
            Utils.showToast(`${errorFiles} 个文件无法添加（格式不支持或文件过大）`, 'error');
        }
    }

    // 更新文件列表显示
    updateFileList() {
        const files = window.fileHandler.getAllFiles();
        
        if (files.length === 0) {
            this.elements.fileList.style.display = 'none';
            return;
        }

        this.elements.fileList.style.display = 'block';
        this.elements.fileItems.innerHTML = '';

        files.forEach(file => {
            const fileItem = this.createFileItemElement(file);
            this.elements.fileItems.appendChild(fileItem);
        });
    }

    // 创建文件项元素
    createFileItemElement(fileInfo) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.fileId = fileInfo.id;

        const iconClass = window.fileHandler.getFileIconClass(fileInfo.name);
        const statusIcon = this.getStatusIcon(fileInfo.status);

        div.innerHTML = `
            <img src="images/${iconClass}.png" alt="文件图标" class="file-icon ${iconClass}">
            <div class="file-info">
                <div class="file-name">${fileInfo.name}</div>
                <div class="file-size">${Utils.formatFileSize(fileInfo.size)}</div>
            </div>
            <div class="file-status">
                ${statusIcon}
                ${fileInfo.status === 'completed' ? 
                    `<button class="download-btn" onclick="uiController.downloadFile('${fileInfo.id}')">下载</button>` : 
                    ''}
                ${fileInfo.status !== 'processing' ? 
                    `<button class="remove-btn" onclick="uiController.removeFile('${fileInfo.id}')">删除</button>` : 
                    ''}
            </div>
        `;

        if (fileInfo.status === 'error') {
            div.title = fileInfo.error;
        }

        return div;
    }

    // 获取状态图标
    getStatusIcon(status) {
        const icons = {
            pending: '<img src="images/status-pending.png" alt="待处理" class="status-icon">',
            processing: '<img src="images/status-processing.png" alt="处理中" class="status-icon status-icon-processing">',
            completed: '<img src="images/status-success.png" alt="已完成" class="status-icon">',
            error: '<img src="images/status-error.png" alt="错误" class="status-icon">'
        };
        return icons[status] || '';
    }

    // 处理文件
    async processFiles() {
        const pendingFiles = window.fileHandler.getPendingFiles();
        if (pendingFiles.length === 0) {
            Utils.showToast('没有待处理的文件', 'warning');
            return;
        }

        // 获取伪装图片
        const coverImage = await this.getCoverImage();
        if (!coverImage) {
            Utils.showToast('请选择伪装图片', 'error');
            return;
        }

        const outputFormat = this.elements.outputFormat.value;
        Utils.showLoading(true, '正在处理文件...');

        let successCount = 0;
        let errorCount = 0;

        for (const fileInfo of pendingFiles) {
            try {
                // 更新状态为处理中
                window.fileHandler.updateFileStatus(fileInfo.id, 'processing');
                this.updateFileItemStatus(fileInfo.id, 'processing');

                // 执行伪装
                const result = await window.disguiseEngine.disguiseFile(
                    fileInfo.file,
                    coverImage,
                    outputFormat
                );

                // 保存结果
                window.fileHandler.saveDisguisedFile(fileInfo.id, result.blob, result.name);
                this.updateFileItemStatus(fileInfo.id, 'completed');

                // 添加到历史记录
                this.addToHistory(fileInfo, result);

                successCount++;
            } catch (error) {
                console.error('处理文件失败:', error);
                window.fileHandler.updateFileStatus(fileInfo.id, 'error', null, error.message);
                this.updateFileItemStatus(fileInfo.id, 'error');
                errorCount++;
            }
        }

        Utils.showLoading(false);

        if (successCount > 0) {
            Utils.showToast(`成功处理 ${successCount} 个文件！文件名包含[改名为.xxx]提示，按提示修改扩展名即可使用`, 'success', 8000);
            
            // 显示详细使用说明
            setTimeout(() => {
                if (confirm('✅ 文件处理完成！\n\n📌 重要提示：\n下载的文件名包含原扩展名提示（如"[改名为.zip]"）\n\n使用方法：\n1. 找到下载的文件\n2. 重命名文件，将后缀从 .jpg/.png 改为提示的扩展名\n3. 改名后即可正常解压或播放\n\n示例：\nfile_[改名为.zip].jpg → 改为 → file.zip\n\n是否查看详细帮助？')) {
                    this.switchPage('help');
                }
            }, 1000);
        }
        if (errorCount > 0) {
            Utils.showToast(`${errorCount} 个文件处理失败`, 'error');
        }
    }

    // 获取封面图片
    async getCoverImage() {
        const selectedOption = this.elements.disguiseImageSelect.value;
        
        if (selectedOption === 'custom') {
            const customFile = this.elements.customImageInput.files[0];
            if (!customFile) {
                Utils.showToast('请选择自定义图片', 'error');
                return null;
            }
            return customFile;
        } else {
            // 使用预设图片
            const presetImages = {
                default: 'images/preset-default.jpg',
                nature: 'images/preset-nature.jpg',
                abstract: 'images/preset-abstract.jpg'
            };
            
            const imagePath = presetImages[selectedOption] || presetImages.default;
            
            try {
                const response = await fetch(imagePath);
                return await response.blob();
            } catch (error) {
                console.error('加载预设图片失败:', error);
                Utils.showToast('加载预设图片失败', 'error');
                return null;
            }
        }
    }

    // 更新文件项状态
    updateFileItemStatus(fileId, status) {
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (!fileItem) return;

        const fileInfo = window.fileHandler.getFile(fileId);
        const newFileItem = this.createFileItemElement(fileInfo);
        fileItem.replaceWith(newFileItem);
    }

    // 下载文件
    downloadFile(fileId) {
        const fileInfo = window.fileHandler.getFile(fileId);
        if (!fileInfo || !fileInfo.disguisedFile) return;

        Utils.downloadFile(fileInfo.disguisedFile.blob, fileInfo.disguisedFile.name);
        Utils.showToast('文件下载已开始', 'success');
    }

    // 删除文件
    removeFile(fileId) {
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.classList.add('removing');
            setTimeout(() => {
                window.fileHandler.removeFile(fileId);
                this.updateFileList();
            }, 300);
        }
    }

    // 清空文件列表
    clearFileList() {
        if (window.fileHandler.hasProcessingFiles()) {
            Utils.showToast('有文件正在处理中，请稍后再试', 'warning');
            return;
        }

        window.fileHandler.clearFiles();
        this.updateFileList();
        Utils.showToast('文件列表已清空', 'info');
    }

    // 添加到历史记录
    addToHistory(fileInfo, result) {
        const history = Utils.storage.get('disguiseHistory', []);
        history.unshift({
            id: Utils.generateUniqueId(),
            originalName: fileInfo.name,
            originalSize: fileInfo.size,
            disguisedName: result.name,
            disguisedSize: result.disguisedSize,
            timestamp: Date.now()
        });

        // 保留最近100条记录
        if (history.length > 100) {
            history.length = 100;
        }

        Utils.storage.set('disguiseHistory', history);
    }

    // 加载历史记录
    loadHistory() {
        const history = Utils.storage.get('disguiseHistory', []);
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
                    <div class="history-name">${record.originalName} → ${record.disguisedName}</div>
                    <div class="history-meta">
                        ${Utils.formatFileSize(record.originalSize)} → ${Utils.formatFileSize(record.disguisedSize)}
                        <span class="history-date">${Utils.formatDate(record.timestamp)}</span>
                    </div>
                </div>
            `;
            this.elements.historyList.appendChild(item);
        });
    }

    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            Utils.storage.remove('disguiseHistory');
            this.loadHistory();
            Utils.showToast('历史记录已清空', 'success');
        }
    }

    // 导出历史记录
    exportHistory() {
        const history = Utils.storage.get('disguiseHistory', []);
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
        const body = document.body;
        const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        body.classList.remove('light-theme', 'dark-theme');
        body.classList.add(`${newTheme}-theme`);
        
        Utils.storage.set('theme', newTheme);
        Utils.showToast(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}主题`, 'info');
    }

    // 批量处理文件
    async handleBatchSelect(files) {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            const validation = window.fileHandler.validateFile(file);
            return validation.valid;
        });

        if (validFiles.length === 0) {
            Utils.showToast('没有找到支持的文件格式', 'warning');
            return;
        }

        Utils.showToast(`开始批量处理 ${validFiles.length} 个文件`, 'info');
        this.elements.batchProgress.style.display = 'block';

        // 获取伪装图片
        const coverImage = await this.getCoverImage();
        if (!coverImage) {
            Utils.showToast('请先选择伪装图片', 'error');
            this.elements.batchProgress.style.display = 'none';
            return;
        }

        const outputFormat = this.elements.outputFormat.value;
        let processedCount = 0;

        for (const file of validFiles) {
            try {
                const progress = Math.round((processedCount / validFiles.length) * 100);
                this.updateBatchProgress(progress, `处理中... ${processedCount}/${validFiles.length}`);

                const result = await window.disguiseEngine.disguiseFile(file, coverImage, outputFormat);
                
                // 直接下载
                Utils.downloadFile(result.blob, result.name);
                
                processedCount++;
            } catch (error) {
                console.error('批量处理文件失败:', error);
            }
        }

        this.updateBatchProgress(100, '批量处理完成！');
        Utils.showToast(`成功处理 ${processedCount} 个文件`, 'success');

        setTimeout(() => {
            this.elements.batchProgress.style.display = 'none';
            this.elements.progressFill.style.width = '0%';
        }, 2000);
    }

    // 更新批量处理进度
    updateBatchProgress(percentage, text) {
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressText.textContent = text;
    }
}

// 创建全局UI控制器实例
window.uiController = new UIController();
