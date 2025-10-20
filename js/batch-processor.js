// 批量处理器模块

class BatchProcessor {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.concurrency = 3; // 同时处理的文件数
        this.progress = {
            total: 0,
            completed: 0,
            failed: 0
        };
    }

    // 添加文件到队列
    addToQueue(files, coverImage, outputFormat) {
        const tasks = Array.from(files).map(file => ({
            id: Utils.generateUniqueId(),
            file: file,
            coverImage: coverImage,
            outputFormat: outputFormat,
            status: 'pending',
            result: null,
            error: null
        }));

        this.queue.push(...tasks);
        this.progress.total += tasks.length;
        
        return tasks;
    }

    // 开始批量处理
    async startProcessing(onProgress, onComplete) {
        if (this.isProcessing) {
            Utils.showToast('批量处理已在进行中', 'warning');
            return;
        }

        this.isProcessing = true;
        const workers = [];

        // 创建并发工作器
        for (let i = 0; i < this.concurrency; i++) {
            workers.push(this.processWorker(onProgress));
        }

        // 等待所有工作器完成
        await Promise.all(workers);

        this.isProcessing = false;
        
        if (onComplete) {
            onComplete(this.progress);
        }

        // 重置进度
        this.resetProgress();
    }

    // 工作器函数
    async processWorker(onProgress) {
        while (this.queue.length > 0) {
            const task = this.queue.find(t => t.status === 'pending');
            if (!task) break;

            task.status = 'processing';

            try {
                // 处理文件
                const result = await window.disguiseEngine.disguiseFile(
                    task.file,
                    task.coverImage,
                    task.outputFormat
                );

                task.status = 'completed';
                task.result = result;
                this.progress.completed++;

                // 自动下载
                Utils.downloadFile(result.blob, result.name);

                // 添加到历史记录
                this.addToHistory(task.file, result);

            } catch (error) {
                console.error('批量处理失败:', error);
                task.status = 'failed';
                task.error = error.message;
                this.progress.failed++;
            }

            // 更新进度
            if (onProgress) {
                const percentage = Math.round(
                    ((this.progress.completed + this.progress.failed) / this.progress.total) * 100
                );
                onProgress(percentage, this.progress);
            }

            // 短暂延迟，避免过于频繁的下载
            await this.delay(100);
        }
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 取消批量处理
    cancelProcessing() {
        this.queue.forEach(task => {
            if (task.status === 'pending') {
                task.status = 'cancelled';
            }
        });
        this.isProcessing = false;
    }

    // 重置进度
    resetProgress() {
        this.progress = {
            total: 0,
            completed: 0,
            failed: 0
        };
        this.queue = [];
    }

    // 获取处理状态
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            queue: this.queue.length,
            progress: { ...this.progress }
        };
    }

    // 添加到历史记录
    addToHistory(file, result) {
        const history = Utils.storage.get('batchHistory', []);
        history.unshift({
            id: Utils.generateUniqueId(),
            originalName: file.name,
            originalSize: file.size,
            disguisedName: result.name,
            disguisedSize: result.disguisedSize,
            timestamp: Date.now(),
            batch: true
        });

        // 保留最近500条批量记录
        if (history.length > 500) {
            history.length = 500;
        }

        Utils.storage.set('batchHistory', history);
    }

    // 智能文件分组
    groupFilesByType(files) {
        const groups = {
            archives: [],
            videos: [],
            others: []
        };

        Array.from(files).forEach(file => {
            const extension = Utils.getFileExtension(file.name);
            
            if (window.fileHandler.supportedArchiveFormats.includes(extension)) {
                groups.archives.push(file);
            } else if (window.fileHandler.supportedVideoFormats.includes(extension)) {
                groups.videos.push(file);
            } else {
                groups.others.push(file);
            }
        });

        return groups;
    }

    // 优化批量处理策略
    async optimizedBatchProcess(files, settings) {
        const groups = this.groupFilesByType(files);
        const results = {
            success: [],
            failed: []
        };

        // 为不同类型的文件使用不同的处理策略
        for (const [type, fileList] of Object.entries(groups)) {
            if (fileList.length === 0) continue;

            // 根据文件类型调整并发数
            this.concurrency = type === 'videos' ? 2 : 5;

            // 处理该类型的文件
            const tasks = this.addToQueue(fileList, settings.coverImage, settings.outputFormat);
            
            await this.startProcessing(
                (percentage, progress) => {
                    if (settings.onProgress) {
                        settings.onProgress(type, percentage, progress);
                    }
                },
                (finalProgress) => {
                    results.success.push(...tasks.filter(t => t.status === 'completed'));
                    results.failed.push(...tasks.filter(t => t.status === 'failed'));
                }
            );
        }

        return results;
    }

    // 估算处理时间
    estimateProcessingTime(files) {
        let totalSize = 0;
        let archiveCount = 0;
        let videoCount = 0;

        Array.from(files).forEach(file => {
            totalSize += file.size;
            const extension = Utils.getFileExtension(file.name);
            
            if (window.fileHandler.supportedArchiveFormats.includes(extension)) {
                archiveCount++;
            } else if (window.fileHandler.supportedVideoFormats.includes(extension)) {
                videoCount++;
            }
        });

        // 基于文件大小和类型估算时间（毫秒）
        // 假设：压缩包 100MB/s，视频 50MB/s
        const archiveTime = (totalSize / (100 * 1024 * 1024)) * archiveCount * 1000;
        const videoTime = (totalSize / (50 * 1024 * 1024)) * videoCount * 1000;
        const estimatedTime = Math.max(archiveTime, videoTime) / this.concurrency;

        return {
            estimatedSeconds: Math.ceil(estimatedTime / 1000),
            totalSize: totalSize,
            fileCount: files.length,
            archiveCount: archiveCount,
            videoCount: videoCount
        };
    }
}

// 创建全局批量处理器实例
window.batchProcessor = new BatchProcessor();
