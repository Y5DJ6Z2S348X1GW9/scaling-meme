// 主题控制器模块

class ThemeController {
    constructor() {
        this.themes = {
            light: {
                name: '浅色主题',
                class: 'light-theme',
                colors: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    background: '#f9fafb',
                    surface: '#ffffff',
                    textPrimary: '#111827',
                    textSecondary: '#6b7280'
                }
            },
            dark: {
                name: '深色主题',
                class: 'dark-theme',
                colors: {
                    primary: '#818cf8',
                    secondary: '#a78bfa',
                    background: '#0f172a',
                    surface: '#1e293b',
                    textPrimary: '#f1f5f9',
                    textSecondary: '#94a3b8'
                }
            },
            rainbow: {
                name: '彩虹主题',
                class: 'rainbow-theme',
                colors: {
                    primary: '#ff6b6b',
                    secondary: '#4ecdc4',
                    background: '#fff5f5',
                    surface: '#ffffff',
                    textPrimary: '#2d3436',
                    textSecondary: '#636e72'
                }
            },
            ocean: {
                name: '海洋主题',
                class: 'ocean-theme',
                colors: {
                    primary: '#0891b2',
                    secondary: '#06b6d4',
                    background: '#f0f9ff',
                    surface: '#e0f2fe',
                    textPrimary: '#0c4a6e',
                    textSecondary: '#0e7490'
                }
            },
            forest: {
                name: '森林主题',
                class: 'forest-theme',
                colors: {
                    primary: '#16a34a',
                    secondary: '#22c55e',
                    background: '#f0fdf4',
                    surface: '#dcfce7',
                    textPrimary: '#14532d',
                    textSecondary: '#166534'
                }
            },
            sunset: {
                name: '日落主题',
                class: 'sunset-theme',
                colors: {
                    primary: '#f97316',
                    secondary: '#fb923c',
                    background: '#fff7ed',
                    surface: '#fed7aa',
                    textPrimary: '#7c2d12',
                    textSecondary: '#9a3412'
                }
            }
        };

        this.currentTheme = this.loadTheme();
        this.systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.initialize();
    }

    // 初始化主题
    initialize() {
        // 应用保存的主题或系统主题
        this.applyTheme(this.currentTheme);

        // 监听系统主题变化
        this.systemThemeMediaQuery.addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applySystemTheme();
            }
        });

        // 创建主题选择器
        this.createThemeSelector();

        // 初始化快捷键
        this.initializeShortcuts();
    }

    // 加载保存的主题
    loadTheme() {
        const savedTheme = Utils.storage.get('theme', 'auto');
        return savedTheme;
    }

    // 应用主题
    applyTheme(themeName) {
        const body = document.body;
        
        // 移除所有主题类
        Object.values(this.themes).forEach(theme => {
            body.classList.remove(theme.class);
        });

        // 应用新主题
        if (themeName === 'auto') {
            this.applySystemTheme();
        } else if (this.themes[themeName]) {
            body.classList.add(this.themes[themeName].class);
            this.updateThemeColors(this.themes[themeName].colors);
        }

        // 保存主题
        this.currentTheme = themeName;
        Utils.storage.set('theme', themeName);

        // 触发主题变更事件
        this.dispatchThemeChangeEvent(themeName);
    }

    // 应用系统主题
    applySystemTheme() {
        const isDark = this.systemThemeMediaQuery.matches;
        const theme = isDark ? this.themes.dark : this.themes.light;
        document.body.classList.add(theme.class);
        this.updateThemeColors(theme.colors);
    }

    // 更新CSS变量
    updateThemeColors(colors) {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVarName, value);
        });
    }

    // 切换主题
    toggleTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        const nextTheme = themeKeys[nextIndex];
        
        this.applyTheme(nextTheme);
        Utils.showToast(`已切换到${this.themes[nextTheme].name}`, 'info');
    }

    // 创建主题选择器
    createThemeSelector() {
        // 检查是否已存在
        if (document.getElementById('themeSelector')) return;

        const selector = document.createElement('div');
        selector.id = 'themeSelector';
        selector.className = 'theme-selector';
        selector.style.display = 'none';

        // 添加主题选项
        Object.entries(this.themes).forEach(([key, theme]) => {
            const option = document.createElement('div');
            option.className = `theme-option theme-${key}`;
            option.title = theme.name;
            option.dataset.theme = key;
            
            // 创建颜色预览
            option.style.background = `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`;
            
            if (this.currentTheme === key) {
                option.classList.add('active');
            }

            option.addEventListener('click', () => {
                this.applyTheme(key);
                this.updateThemeSelector();
            });

            selector.appendChild(option);
        });

        // 添加自动主题选项
        const autoOption = document.createElement('div');
        autoOption.className = 'theme-option theme-auto';
        autoOption.title = '跟随系统';
        autoOption.dataset.theme = 'auto';
        autoOption.style.background = 'linear-gradient(135deg, #333, #eee)';
        
        if (this.currentTheme === 'auto') {
            autoOption.classList.add('active');
        }

        autoOption.addEventListener('click', () => {
            this.applyTheme('auto');
            this.updateThemeSelector();
        });

        selector.appendChild(autoOption);
        document.body.appendChild(selector);
    }

    // 更新主题选择器状态
    updateThemeSelector() {
        const selector = document.getElementById('themeSelector');
        if (!selector) return;

        selector.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
    }

    // 显示/隐藏主题选择器
    toggleThemeSelector() {
        const selector = document.getElementById('themeSelector');
        if (!selector) return;

        const isVisible = selector.style.display !== 'none';
        selector.style.display = isVisible ? 'none' : 'flex';
    }

    // 初始化快捷键
    initializeShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T: 切换主题
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Ctrl/Cmd + Shift + P: 显示主题选择器
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggleThemeSelector();
            }
        });
    }

    // 触发主题变更事件
    dispatchThemeChangeEvent(themeName) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: themeName,
                colors: themeName === 'auto' ? 
                    (this.systemThemeMediaQuery.matches ? this.themes.dark.colors : this.themes.light.colors) :
                    this.themes[themeName].colors
            }
        });
        document.dispatchEvent(event);
    }

    // 获取当前主题信息
    getCurrentThemeInfo() {
        if (this.currentTheme === 'auto') {
            const isDark = this.systemThemeMediaQuery.matches;
            return isDark ? this.themes.dark : this.themes.light;
        }
        return this.themes[this.currentTheme];
    }

    // 预加载主题资源（已禁用，不需要额外图片）
    preloadThemeAssets() {
        // 不再预加载主题背景图片，节省资源
        return;
    }

    // 创建自定义主题
    createCustomTheme(name, colors) {
        const customThemeKey = `custom_${Date.now()}`;
        this.themes[customThemeKey] = {
            name: name,
            class: `custom-theme-${customThemeKey}`,
            colors: colors
        };

        // 动态创建CSS
        const style = document.createElement('style');
        style.id = `theme-${customThemeKey}`;
        style.textContent = `
            body.${this.themes[customThemeKey].class} {
                --primary-color: ${colors.primary};
                --secondary-color: ${colors.secondary};
                --background-color: ${colors.background};
                --surface-color: ${colors.surface};
                --text-primary: ${colors.textPrimary};
                --text-secondary: ${colors.textSecondary};
            }
        `;
        document.head.appendChild(style);

        // 保存自定义主题
        const customThemes = Utils.storage.get('customThemes', {});
        customThemes[customThemeKey] = this.themes[customThemeKey];
        Utils.storage.set('customThemes', customThemes);

        return customThemeKey;
    }

    // 加载自定义主题
    loadCustomThemes() {
        const customThemes = Utils.storage.get('customThemes', {});
        Object.assign(this.themes, customThemes);
    }

    // 导出主题配置
    exportThemeConfig() {
        const config = {
            themes: this.themes,
            currentTheme: this.currentTheme
        };
        return JSON.stringify(config, null, 2);
    }

    // 导入主题配置
    importThemeConfig(configJson) {
        try {
            const config = JSON.parse(configJson);
            if (config.themes) {
                Object.assign(this.themes, config.themes);
                if (config.currentTheme) {
                    this.applyTheme(config.currentTheme);
                }
                return true;
            }
        } catch (error) {
            console.error('导入主题配置失败:', error);
        }
        return false;
    }
}

// 创建全局主题控制器实例
window.themeController = new ThemeController();
