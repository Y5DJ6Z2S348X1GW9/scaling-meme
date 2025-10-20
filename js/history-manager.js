// 历史记录管理器模块

class HistoryManager {
    constructor() {
        this.storageKey = 'fileDisguiseHistory';
        this.maxRecords = 1000;
        this.pageSize = 50;
        this.currentPage = 1;
        this.filters = {
            dateRange: null,
            fileType: null,
            searchQuery: null
        };
    }

    // 添加历史记录
    addRecord(originalFile, disguisedResult, metadata = {}) {
        const record = {
            id: Utils.generateUniqueId(),
            originalName: originalFile.name,
            originalSize: originalFile.size,
            originalType: originalFile.type,
            originalExtension: Utils.getFileExtension(originalFile.name),
            disguisedName: disguisedResult.name,
            disguisedSize: disguisedResult.disguisedSize,
            outputFormat: Utils.getFileExtension(disguisedResult.name),
            timestamp: Date.now(),
            duration: metadata.duration || 0,
            success: true,
            ...metadata
        };

        const history = this.getHistory();
        history.unshift(record);

        // 限制记录数量
        if (history.length > this.maxRecords) {
            history.length = this.maxRecords;
        }

        this.saveHistory(history);
        return record;
    }

    // 添加失败记录
    addFailureRecord(originalFile, error, metadata = {}) {
        const record = {
            id: Utils.generateUniqueId(),
            originalName: originalFile.name,
            originalSize: originalFile.size,
            originalType: originalFile.type,
            originalExtension: Utils.getFileExtension(originalFile.name),
            timestamp: Date.now(),
            success: false,
            error: error.message || error,
            ...metadata
        };

        const history = this.getHistory();
        history.unshift(record);

        if (history.length > this.maxRecords) {
            history.length = this.maxRecords;
        }

        this.saveHistory(history);
        return record;
    }

    // 获取历史记录
    getHistory() {
        return Utils.storage.get(this.storageKey, []);
    }

    // 保存历史记录
    saveHistory(history) {
        Utils.storage.set(this.storageKey, history);
    }

    // 清空历史记录
    clearHistory() {
        Utils.storage.remove(this.storageKey);
        this.currentPage = 1;
    }

    // 获取分页历史记录
    getPagedHistory(page = 1) {
        const history = this.getFilteredHistory();
        const start = (page - 1) * this.pageSize;
        const end = start + this.pageSize;

        return {
            records: history.slice(start, end),
            totalRecords: history.length,
            totalPages: Math.ceil(history.length / this.pageSize),
            currentPage: page,
            pageSize: this.pageSize
        };
    }

    // 获取过滤后的历史记录
    getFilteredHistory() {
        let history = this.getHistory();

        // 日期范围过滤
        if (this.filters.dateRange) {
            const { start, end } = this.filters.dateRange;
            history = history.filter(record => {
                return record.timestamp >= start && record.timestamp <= end;
            });
        }

        // 文件类型过滤
        if (this.filters.fileType) {
            history = history.filter(record => {
                return record.originalExtension === this.filters.fileType;
            });
        }

        // 搜索查询过滤
        if (this.filters.searchQuery) {
            const query = this.filters.searchQuery.toLowerCase();
            history = history.filter(record => {
                return record.originalName.toLowerCase().includes(query) ||
                       (record.disguisedName && record.disguisedName.toLowerCase().includes(query));
            });
        }

        return history;
    }

    // 设置过滤器
    setFilter(filterType, value) {
        this.filters[filterType] = value;
        this.currentPage = 1; // 重置到第一页
    }

    // 清除过滤器
    clearFilters() {
        this.filters = {
            dateRange: null,
            fileType: null,
            searchQuery: null
        };
        this.currentPage = 1;
    }

    // 获取统计信息
    getStatistics() {
        const history = this.getHistory();
        const stats = {
            totalRecords: history.length,
            successCount: 0,
            failureCount: 0,
            totalOriginalSize: 0,
            totalDisguisedSize: 0,
            averageCompressionRatio: 0,
            fileTypeDistribution: {},
            dailyDistribution: {},
            hourlyDistribution: new Array(24).fill(0)
        };

        history.forEach(record => {
            // 成功/失败统计
            if (record.success) {
                stats.successCount++;
                stats.totalOriginalSize += record.originalSize || 0;
                stats.totalDisguisedSize += record.disguisedSize || 0;
            } else {
                stats.failureCount++;
            }

            // 文件类型分布
            const ext = record.originalExtension;
            stats.fileTypeDistribution[ext] = (stats.fileTypeDistribution[ext] || 0) + 1;

            // 每日分布
            const date = new Date(record.timestamp).toDateString();
            stats.dailyDistribution[date] = (stats.dailyDistribution[date] || 0) + 1;

            // 小时分布
            const hour = new Date(record.timestamp).getHours();
            stats.hourlyDistribution[hour]++;
        });

        // 计算平均压缩比
        if (stats.totalOriginalSize > 0) {
            stats.averageCompressionRatio = 
                ((stats.totalDisguisedSize - stats.totalOriginalSize) / stats.totalOriginalSize * 100).toFixed(2);
        }

        return stats;
    }

    // 导出历史记录
    exportHistory(format = 'json') {
        const history = this.getFilteredHistory();
        
        if (format === 'json') {
            return JSON.stringify(history, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(history);
        } else if (format === 'html') {
            return this.convertToHTML(history);
        }
        
        throw new Error('不支持的导出格式');
    }

    // 转换为CSV格式
    convertToCSV(history) {
        const headers = [
            '时间', '原始文件名', '原始大小', '伪装文件名', '伪装大小', '状态', '错误信息'
        ];
        
        const rows = history.map(record => [
            Utils.formatDate(record.timestamp),
            record.originalName,
            Utils.formatFileSize(record.originalSize || 0),
            record.disguisedName || '-',
            Utils.formatFileSize(record.disguisedSize || 0),
            record.success ? '成功' : '失败',
            record.error || '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    // 转换为HTML格式
    convertToHTML(history) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>文件伪装历史记录</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .success { color: green; }
        .failure { color: red; }
    </style>
</head>
<body>
    <h1>文件伪装历史记录</h1>
    <p>导出时间：${Utils.formatDate(Date.now())}</p>
    <p>总记录数：${history.length}</p>
    <table>
        <thead>
            <tr>
                <th>时间</th>
                <th>原始文件名</th>
                <th>原始大小</th>
                <th>伪装文件名</th>
                <th>伪装大小</th>
                <th>状态</th>
                <th>备注</th>
            </tr>
        </thead>
        <tbody>
            ${history.map(record => `
                <tr>
                    <td>${Utils.formatDate(record.timestamp)}</td>
                    <td>${record.originalName}</td>
                    <td>${Utils.formatFileSize(record.originalSize || 0)}</td>
                    <td>${record.disguisedName || '-'}</td>
                    <td>${Utils.formatFileSize(record.disguisedSize || 0)}</td>
                    <td class="${record.success ? 'success' : 'failure'}">
                        ${record.success ? '成功' : '失败'}
                    </td>
                    <td>${record.error || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
        
        return html;
    }

    // 删除单条记录
    deleteRecord(recordId) {
        const history = this.getHistory();
        const index = history.findIndex(record => record.id === recordId);
        
        if (index !== -1) {
            history.splice(index, 1);
            this.saveHistory(history);
            return true;
        }
        
        return false;
    }

    // 批量删除记录
    deleteRecords(recordIds) {
        const history = this.getHistory();
        const filteredHistory = history.filter(record => !recordIds.includes(record.id));
        
        if (filteredHistory.length < history.length) {
            this.saveHistory(filteredHistory);
            return history.length - filteredHistory.length;
        }
        
        return 0;
    }

    // 获取最近的记录
    getRecentRecords(count = 10) {
        const history = this.getHistory();
        return history.slice(0, count);
    }

    // 搜索历史记录
    searchHistory(query) {
        const history = this.getHistory();
        const lowerQuery = query.toLowerCase();
        
        return history.filter(record => {
            const searchableFields = [
                record.originalName,
                record.disguisedName,
                record.originalExtension,
                record.outputFormat
            ].filter(Boolean);
            
            return searchableFields.some(field => 
                field.toLowerCase().includes(lowerQuery)
            );
        });
    }
}

// 创建全局历史管理器实例
window.historyManager = new HistoryManager();
