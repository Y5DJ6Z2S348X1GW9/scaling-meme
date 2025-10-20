"""
文件伪装网站图像资源生成器
生成所有需要的图标和图像资源
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import numpy as np
from pathlib import Path
import colorsys
import random

# 创建images目录
images_dir = Path("images")
images_dir.mkdir(exist_ok=True)

# 定义颜色主题
COLORS = {
    'primary': (99, 102, 241),      # #6366f1
    'secondary': (139, 92, 246),    # #8b5cf6
    'success': (16, 185, 129),      # #10b981
    'error': (239, 68, 68),         # #ef4444
    'warning': (245, 158, 11),      # #f59e0b
    'info': (59, 130, 246),         # #3b82f6
    'dark': (30, 41, 59),           # #1e293b
    'light': (241, 245, 249),       # #f1f5f9
    'white': (255, 255, 255),
    'black': (0, 0, 0)
}

def create_gradient(size, color1, color2, direction='diagonal'):
    """创建渐变背景"""
    width, height = size
    base = Image.new('RGB', size, color1)
    top = Image.new('RGB', size, color2)
    mask = Image.new('L', size)
    mask_data = []
    
    for y in range(height):
        for x in range(width):
            if direction == 'diagonal':
                value = int(255 * (x + y) / (width + height))
            elif direction == 'horizontal':
                value = int(255 * x / width)
            elif direction == 'vertical':
                value = int(255 * y / height)
            elif direction == 'radial':
                cx, cy = width / 2, height / 2
                distance = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                max_distance = ((width / 2) ** 2 + (height / 2) ** 2) ** 0.5
                value = int(255 * (1 - distance / max_distance))
            else:
                value = 128
            mask_data.append(value)
    
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def add_shadow(image, offset=(5, 5), blur_radius=4, shadow_color=(0, 0, 0, 80)):
    """为图像添加阴影"""
    width, height = image.size
    shadow = Image.new('RGBA', (width + abs(offset[0]) * 2, height + abs(offset[1]) * 2), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    
    shadow_draw.rectangle(
        (abs(offset[0]), abs(offset[1]), width + abs(offset[0]), height + abs(offset[1])),
        fill=shadow_color
    )
    
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur_radius))
    
    final = Image.new('RGBA', shadow.size, (0, 0, 0, 0))
    final.paste(shadow, (0, 0))
    final.paste(image, (abs(offset[0]) - offset[0], abs(offset[1]) - offset[1]))
    
    return final

def create_logo():
    """创建网站Logo"""
    size = (128, 128)
    logo = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(logo)
    
    # 创建渐变背景圆
    gradient = create_gradient(size, COLORS['primary'], COLORS['secondary'], 'diagonal')
    mask = Image.new('L', size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((4, 4, 124, 124), fill=255)
    logo.paste(gradient, (0, 0), mask)
    
    # 绘制文件图标
    draw.rectangle((40, 30, 88, 80), fill=COLORS['white'], outline=None)
    draw.polygon([(88, 30), (88, 50), (68, 30)], fill=COLORS['light'])
    
    # 绘制锁图标
    draw.arc((45, 65, 65, 85), 0, 180, fill=COLORS['white'], width=3)
    draw.rectangle((42, 75, 68, 95), fill=COLORS['white'])
    draw.ellipse((53, 82, 57, 86), fill=COLORS['primary'])
    
    # 保存不同尺寸
    logo.save(images_dir / "logo.png")
    logo.resize((48, 48), Image.Resampling.LANCZOS).save(images_dir / "logo-48.png")
    logo.resize((32, 32), Image.Resampling.LANCZOS).save(images_dir / "logo-32.png")
    
    # 创建favicon
    logo.resize((16, 16), Image.Resampling.LANCZOS).save(images_dir / "favicon.ico")

def create_file_icons():
    """创建文件类型图标"""
    icon_size = (64, 64)
    
    file_types = {
        'file-zip': {'color': COLORS['primary'], 'text': 'ZIP'},
        'file-rar': {'color': COLORS['secondary'], 'text': 'RAR'},
        'file-7z': {'color': COLORS['info'], 'text': '7Z'},
        'file-video': {'color': COLORS['error'], 'text': '▶'},
        'file-mp4': {'color': COLORS['error'], 'text': 'MP4'},
        'file-avi': {'color': COLORS['warning'], 'text': 'AVI'},
        'file-mkv': {'color': COLORS['success'], 'text': 'MKV'},
        'file-image': {'color': COLORS['info'], 'text': '🖼'},
        'file-unknown': {'color': COLORS['dark'], 'text': '?'}
    }
    
    for name, config in file_types.items():
        icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(icon)
        
        # 文件背景
        draw.rectangle((8, 4, 56, 60), fill=COLORS['white'], outline=config['color'], width=2)
        draw.polygon([(44, 4), (56, 4), (56, 16)], fill=config['color'])
        
        # 文件类型标识
        if len(config['text']) <= 3:
            try:
                font = ImageFont.truetype("arial.ttf", 14)
            except:
                font = ImageFont.load_default()
            
            text_bbox = draw.textbbox((0, 0), config['text'], font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            
            text_x = 32 - text_width // 2
            text_y = 32 - text_height // 2
            draw.text((text_x, text_y), config['text'], fill=config['color'], font=font)
        else:
            # 对于特殊字符，画一个简单的图形
            draw.ellipse((24, 24, 40, 40), fill=config['color'])
        
        icon = add_shadow(icon, offset=(2, 2), blur_radius=2)
        icon.save(images_dir / f"{name}.png")

def create_status_icons():
    """创建状态图标"""
    icon_size = (32, 32)
    
    # 成功图标
    success_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(success_icon)
    draw.ellipse((2, 2, 30, 30), fill=COLORS['success'])
    draw.line([(9, 16), (13, 20), (22, 11)], fill=COLORS['white'], width=3)
    success_icon.save(images_dir / "status-success.png")
    
    # 错误图标
    error_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(error_icon)
    draw.ellipse((2, 2, 30, 30), fill=COLORS['error'])
    draw.line([(10, 10), (22, 22)], fill=COLORS['white'], width=3)
    draw.line([(22, 10), (10, 22)], fill=COLORS['white'], width=3)
    error_icon.save(images_dir / "status-error.png")
    
    # 警告图标
    warning_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(warning_icon)
    draw.polygon([(16, 4), (28, 26), (4, 26)], fill=COLORS['warning'])
    draw.text((14, 12), "!", fill=COLORS['white'], font=ImageFont.load_default())
    warning_icon.save(images_dir / "status-warning.png")
    
    # 处理中图标
    processing_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(processing_icon)
    for i in range(8):
        angle = i * 45
        x = 16 + 10 * np.cos(np.radians(angle))
        y = 16 + 10 * np.sin(np.radians(angle))
        opacity = int(255 * (i + 1) / 8)
        color = (*COLORS['primary'], opacity)
        draw.ellipse((x-3, y-3, x+3, y+3), fill=color)
    processing_icon.save(images_dir / "status-processing.png")
    
    # 待处理图标
    pending_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(pending_icon)
    draw.ellipse((2, 2, 30, 30), fill=COLORS['light'], outline=COLORS['dark'], width=2)
    draw.ellipse((14, 14, 18, 18), fill=COLORS['dark'])
    pending_icon.save(images_dir / "status-pending.png")

def create_ui_icons():
    """创建UI功能图标"""
    icon_size = (48, 48)
    
    # 上传图标
    upload_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(upload_icon)
    draw.rectangle((8, 20, 40, 40), fill=COLORS['primary'], outline=None)
    draw.polygon([(24, 8), (32, 20), (16, 20)], fill=COLORS['primary'])
    draw.line([(24, 20), (24, 32)], fill=COLORS['white'], width=3)
    upload_icon.save(images_dir / "icon-upload.png")
    upload_icon.resize((80, 80), Image.Resampling.LANCZOS).save(images_dir / "upload-icon.png")
    
    # 下载图标
    download_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(download_icon)
    draw.rectangle((8, 20, 40, 40), fill=COLORS['success'], outline=None)
    draw.polygon([(24, 32), (32, 20), (16, 20)], fill=COLORS['success'])
    draw.line([(24, 8), (24, 20)], fill=COLORS['white'], width=3)
    download_icon.save(images_dir / "icon-download.png")
    
    # 删除图标
    delete_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(delete_icon)
    draw.rectangle((14, 16, 34, 40), fill=COLORS['error'], outline=None)
    draw.rectangle((10, 12, 38, 16), fill=COLORS['error'])
    draw.line([(20, 12), (20, 8), (28, 8), (28, 12)], fill=COLORS['error'], width=2)
    delete_icon.save(images_dir / "icon-delete.png")
    
    # 设置图标
    settings_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(settings_icon)
    # 绘制齿轮
    center = (24, 24)
    for i in range(8):
        angle = i * 45
        x1 = center[0] + 16 * np.cos(np.radians(angle))
        y1 = center[1] + 16 * np.sin(np.radians(angle))
        x2 = center[0] + 20 * np.cos(np.radians(angle))
        y2 = center[1] + 20 * np.sin(np.radians(angle))
        draw.ellipse((x1-4, y1-4, x1+4, y1+4), fill=COLORS['dark'])
    draw.ellipse((16, 16, 32, 32), fill=COLORS['dark'])
    draw.ellipse((20, 20, 28, 28), fill=COLORS['white'])
    settings_icon.save(images_dir / "icon-settings.png")
    
    # 帮助图标
    help_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(help_icon)
    draw.ellipse((4, 4, 44, 44), fill=COLORS['info'])
    draw.text((20, 14), "?", fill=COLORS['white'], font=ImageFont.load_default())
    help_icon.save(images_dir / "icon-help.png")
    
    # 历史图标
    history_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(history_icon)
    draw.arc((8, 8, 40, 40), 45, 315, fill=COLORS['secondary'], width=4)
    draw.polygon([(40, 24), (35, 20), (35, 28)], fill=COLORS['secondary'])
    draw.line([(24, 24), (24, 16), (32, 16)], fill=COLORS['secondary'], width=3)
    history_icon.save(images_dir / "icon-history.png")
    
    # 批量处理图标
    batch_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(batch_icon)
    for i, y in enumerate([10, 24, 38]):
        color = [COLORS['primary'], COLORS['secondary'], COLORS['info']][i]
        draw.rectangle((8, y-4, 40, y+4), fill=color)
    batch_icon.save(images_dir / "icon-batch.png")
    batch_icon.resize((80, 80), Image.Resampling.LANCZOS).save(images_dir / "batch-icon.png")
    
    # 主题图标
    theme_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(theme_icon)
    # 太阳
    draw.ellipse((8, 8, 24, 24), fill=COLORS['warning'])
    for i in range(8):
        angle = i * 45
        x1 = 16 + 8 * np.cos(np.radians(angle))
        y1 = 16 + 8 * np.sin(np.radians(angle))
        x2 = 16 + 12 * np.cos(np.radians(angle))
        y2 = 16 + 12 * np.sin(np.radians(angle))
        draw.line([(x1, y1), (x2, y2)], fill=COLORS['warning'], width=2)
    # 月亮
    draw.pieslice((24, 24, 40, 40), 330, 150, fill=COLORS['dark'])
    theme_icon.save(images_dir / "icon-theme.png")
    theme_icon.save(images_dir / "theme-icon.png")

def create_preset_images():
    """创建预设伪装图片"""
    image_size = (800, 600)
    
    # 默认风景图
    default_img = create_gradient(image_size, COLORS['primary'], COLORS['secondary'], 'diagonal')
    draw = ImageDraw.Draw(default_img)
    # 添加装饰性元素
    for i in range(20):
        x = random.randint(0, 800)
        y = random.randint(0, 600)
        size = random.randint(20, 100)
        opacity = random.randint(50, 150)
        color = (*COLORS['white'], opacity)
        draw.ellipse((x, y, x+size, y+size), fill=color)
    default_img.save(images_dir / "preset-default.jpg", "JPEG", quality=95)
    
    # 自然风光
    nature_img = Image.new('RGB', image_size, COLORS['success'])
    draw = ImageDraw.Draw(nature_img)
    # 绘制山脉
    points = []
    for x in range(0, 801, 50):
        y = 300 + random.randint(-50, 50)
        points.append((x, y))
    points.extend([(800, 600), (0, 600)])
    draw.polygon(points, fill=(34, 139, 34))
    
    # 绘制太阳
    draw.ellipse((600, 50, 700, 150), fill=COLORS['warning'])
    
    # 绘制云朵
    for i in range(5):
        x = random.randint(50, 750)
        y = random.randint(50, 200)
        for j in range(3):
            draw.ellipse((x+j*20, y, x+j*20+40, y+30), fill=COLORS['white'])
    
    nature_img.save(images_dir / "preset-nature.jpg", "JPEG", quality=95)
    
    # 抽象艺术
    abstract_img = Image.new('RGB', image_size, COLORS['dark'])
    draw = ImageDraw.Draw(abstract_img)
    
    # 创建随机形状和颜色
    for i in range(50):
        shape_type = random.choice(['circle', 'rectangle', 'triangle'])
        color_choice = random.choice(list(COLORS.values()))
        x1 = random.randint(0, 700)
        y1 = random.randint(0, 500)
        x2 = x1 + random.randint(50, 200)
        y2 = y1 + random.randint(50, 200)
        
        if shape_type == 'circle':
            draw.ellipse((x1, y1, x2, y2), fill=color_choice)
        elif shape_type == 'rectangle':
            draw.rectangle((x1, y1, x2, y2), fill=color_choice)
        else:
            points = [(x1, y2), (x2, y2), ((x1+x2)//2, y1)]
            draw.polygon(points, fill=color_choice)
    
    abstract_img.save(images_dir / "preset-abstract.jpg", "JPEG", quality=95)

def create_help_images():
    """创建帮助页面的说明图片"""
    help_size = (200, 200)
    
    for i in range(1, 4):
        help_img = Image.new('RGBA', help_size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(help_img)
        
        # 背景圆
        gradient = create_gradient(help_size, COLORS['primary'], COLORS['secondary'], 'radial')
        mask = Image.new('L', help_size, 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse((10, 10, 190, 190), fill=255)
        help_img.paste(gradient, (0, 0), mask)
        
        # 步骤数字
        try:
            font = ImageFont.truetype("arial.ttf", 60)
        except:
            font = ImageFont.load_default()
        
        draw.text((90, 70), str(i), fill=COLORS['white'], font=font)
        
        help_img.save(images_dir / f"help-{i}.png")

def create_decoration_images():
    """创建装饰性图片"""
    # 装饰图案1
    deco1 = Image.new('RGBA', (200, 200), (0, 0, 0, 0))
    draw = ImageDraw.Draw(deco1)
    for i in range(5):
        for j in range(5):
            x = i * 40 + 10
            y = j * 40 + 10
            color = (*COLORS['primary'], 50)
            draw.rectangle((x, y, x+20, y+20), fill=color)
    deco1.save(images_dir / "decoration-1.png")
    
    # 装饰图案2
    deco2 = Image.new('RGBA', (200, 200), (0, 0, 0, 0))
    draw = ImageDraw.Draw(deco2)
    center = (100, 100)
    for radius in range(20, 100, 20):
        color = (*COLORS['secondary'], 30)
        draw.ellipse((center[0]-radius, center[1]-radius, 
                     center[0]+radius, center[1]+radius), 
                     outline=color, width=3)
    deco2.save(images_dir / "decoration-2.png")

def create_all_images():
    """生成所有图像资源"""
    print("开始生成图像资源...")
    
    # 创建各类图像
    create_logo()
    print("✓ Logo创建完成")
    
    create_file_icons()
    print("✓ 文件图标创建完成")
    
    create_status_icons()
    print("✓ 状态图标创建完成")
    
    create_ui_icons()
    print("✓ UI图标创建完成")
    
    create_preset_images()
    print("✓ 预设图片创建完成")
    
    create_help_images()
    print("✓ 帮助图片创建完成")
    
    create_decoration_images()
    print("✓ 装饰图片创建完成")
    
    print(f"\n所有图像资源已生成到 {images_dir} 目录")
    print(f"共生成 {len(list(images_dir.glob('*.png'))) + len(list(images_dir.glob('*.jpg')))} 个图像文件")

if __name__ == "__main__":
    create_all_images()
