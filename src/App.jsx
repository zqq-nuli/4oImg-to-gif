import { useState, useRef, useEffect } from "react";
import "./App.css";
import GIF from "gif.js";

// 翻译字典
const translations = {
    zh: {
        title: "图像分割 GIF 生成器",
        chooseImage: "选择图片",
        byRowsCols: "按行列数切分",
        bySize: "按精灵尺寸切分",
        cols: "列数:",
        rows: "行数:",
        frameWidth: "帧宽度:",
        frameHeight: "帧高度:",
        frameDelay: "帧延迟 (ms):",
        frameSizeInfo: "每帧尺寸:",
        generateFramesInfo: "可生成:",
        frames: "帧",
        sortFrames: "排序帧顺序",
        customizeFrames: "自定义帧位置和尺寸",
        posX: "X坐标:",
        posY: "Y坐标:",
        width: "宽度:",
        height: "高度:",
        resetPos: "重置位置",
        resetSize: "重置尺寸",
        generating: "生成中...",
        generatePreview: "生成GIF预览",
        gifPreview: "GIF 预览",
        saveGif: "保存 GIF",
        saveApng: "保存 APNG",
        px: "px",
    },
    en: {
        title: "Sprite Sheet GIF Generator",
        chooseImage: "Choose Image",
        byRowsCols: "Split by Rows & Columns",
        bySize: "Split by Sprite Size",
        cols: "Columns:",
        rows: "Rows:",
        frameWidth: "Frame Width:",
        frameHeight: "Frame Height:",
        frameDelay: "Frame Delay (ms):",
        frameSizeInfo: "Frame Size:",
        generateFramesInfo: "Can generate:",
        frames: "frames",
        sortFrames: "Sort Frame Order",
        customizeFrames: "Customize Frame Position & Size",
        posX: "X Position:",
        posY: "Y Position:",
        width: "Width:",
        height: "Height:",
        resetPos: "Reset Position",
        resetSize: "Reset Size",
        generating: "Generating...",
        generatePreview: "Generate GIF Preview",
        gifPreview: "GIF Preview",
        saveGif: "Save GIF",
        saveApng: "Save APNG",
        px: "px",
    },
};

function App() {
    const [, setImageFile] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [sprites, setSprites] = useState([]);
    const [cols, setCols] = useState(4);
    const [rows, setRows] = useState(4);
    const [spriteWidth, setSpriteWidth] = useState(0);
    const [spriteHeight, setSpriteHeight] = useState(0);
    const [customSize, setCustomSize] = useState(false);
    const [frameOrder, setFrameOrder] = useState([]);
    const [gifPreview, setGifPreview] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [delay, setDelay] = useState(200); // 每帧延迟时间（毫秒）
    const [language, setLanguage] = useState("zh"); // 默认语言为中文
    const [selectedFrameId, setSelectedFrameId] = useState(null); // 当前选中的帧ID
    const canvasRef = useRef(null);

    // 获取当前语言的翻译
    const t = translations[language];

    // 切换语言
    const toggleLanguage = () => {
        setLanguage(prev => (prev === "zh" ? "en" : "zh"));
    };

    // 当用户上传图片时
    const handleImageUpload = e => {
        const file = e.target.files[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                // 初始化精灵尺寸为自动计算的值
                setSpriteWidth(Math.floor(img.width / cols));
                setSpriteHeight(Math.floor(img.height / rows));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // 图片加载后自动分割
    useEffect(() => {
        if (!originalImage) return;
        splitImage();
    }, [originalImage, cols, rows, spriteWidth, spriteHeight, customSize]);

    // 分割图片
    const splitImage = () => {
        if (!originalImage) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // 设置canvas尺寸
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        const ctx = canvas.getContext("2d");

        // 在canvas上绘制原始图像
        ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);

        // 根据设置选择精灵尺寸
        let finalSpriteWidth, finalSpriteHeight;
        let finalCols, finalRows;

        if (customSize) {
            // 使用用户自定义的尺寸
            finalSpriteWidth = spriteWidth;
            finalSpriteHeight = spriteHeight;
            // 计算实际的行列数
            finalCols = Math.floor(originalImage.width / spriteWidth);
            finalRows = Math.floor(originalImage.height / spriteHeight);
        } else {
            // 使用行列数计算尺寸
            finalSpriteWidth = Math.floor(originalImage.width / cols);
            finalSpriteHeight = Math.floor(originalImage.height / rows);
            finalCols = cols;
            finalRows = rows;
        }

        const newSprites = [];

        for (let y = 0; y < finalRows; y++) {
            for (let x = 0; x < finalCols; x++) {
                // 创建临时画布用于保存每个精灵
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = finalSpriteWidth;
                tempCanvas.height = finalSpriteHeight;
                const tempCtx = tempCanvas.getContext("2d");

                // 绘制当前精灵到临时画布
                tempCtx.drawImage(
                    originalImage,
                    x * finalSpriteWidth,
                    y * finalSpriteHeight,
                    finalSpriteWidth,
                    finalSpriteHeight,
                    0,
                    0,
                    finalSpriteWidth,
                    finalSpriteHeight
                );

                // 保存精灵数据
                newSprites.push({
                    id: y * finalCols + x,
                    image: tempCanvas.toDataURL(),
                    x: x * finalSpriteWidth,
                    y: y * finalSpriteHeight,
                    width: finalSpriteWidth,
                    height: finalSpriteHeight,
                    originalX: x * finalSpriteWidth,
                    originalY: y * finalSpriteHeight,
                    originalWidth: finalSpriteWidth,
                    originalHeight: finalSpriteHeight,
                });
            }
        }

        setSprites(newSprites);

        // 初始化帧顺序为正常顺序
        const initialOrder = newSprites.map(sprite => sprite.id);
        setFrameOrder(initialOrder);
        // 重置选中的帧
        setSelectedFrameId(null);
    };

    // 更新行列数
    const handleGridChange = (e, type) => {
        const value = parseInt(e.target.value);
        if (value > 0) {
            if (type === "cols") {
                setCols(value);
                if (!customSize) {
                    setSpriteWidth(Math.floor(originalImage?.width / value));
                }
            } else if (type === "rows") {
                setRows(value);
                if (!customSize) {
                    setSpriteHeight(Math.floor(originalImage?.height / value));
                }
            }
        }
    };

    // 更新精灵尺寸
    const handleSpriteSize = (e, type) => {
        const value = parseInt(e.target.value);
        if (value > 0) {
            if (type === "width") {
                setSpriteWidth(value);
                if (customSize) {
                    setCols(Math.floor(originalImage?.width / value));
                }
            } else if (type === "height") {
                setSpriteHeight(value);
                if (customSize) {
                    setRows(Math.floor(originalImage?.height / value));
                }
            }
        }
    };

    // 切换尺寸模式
    const toggleSizeMode = () => {
        setCustomSize(!customSize);
    };

    // 更新精灵位置或尺寸
    const updateSpriteProperty = (id, property, value) => {
        setSprites(prevSprites => {
            return prevSprites.map(sprite => {
                if (sprite.id === id) {
                    const updatedSprite = { ...sprite, [property]: parseInt(value) || 0 };

                    // 创建临时画布更新精灵图像预览
                    const tempCanvas = document.createElement("canvas");
                    const newWidth =
                        property === "width" ? parseInt(value) || sprite.width : sprite.width;
                    const newHeight =
                        property === "height" ? parseInt(value) || sprite.height : sprite.height;
                    tempCanvas.width = newWidth;
                    tempCanvas.height = newHeight;
                    const tempCtx = tempCanvas.getContext("2d");

                    // 获取新坐标
                    const newX = property === "x" ? parseInt(value) || sprite.x : sprite.x;
                    const newY = property === "y" ? parseInt(value) || sprite.y : sprite.y;

                    // 从原始图像中提取新区域
                    tempCtx.drawImage(
                        originalImage,
                        newX,
                        newY,
                        newWidth,
                        newHeight,
                        0,
                        0,
                        newWidth,
                        newHeight
                    );

                    // 更新精灵图像
                    updatedSprite.image = tempCanvas.toDataURL();

                    return updatedSprite;
                }
                return sprite;
            });
        });
    };

    // 重置精灵位置
    const resetSpritePosition = id => {
        setSprites(prevSprites => {
            return prevSprites.map(sprite => {
                if (sprite.id === id) {
                    // 创建临时画布
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = sprite.width;
                    tempCanvas.height = sprite.height;
                    const tempCtx = tempCanvas.getContext("2d");

                    // 从原始图像中提取原始位置的区域
                    tempCtx.drawImage(
                        originalImage,
                        sprite.originalX,
                        sprite.originalY,
                        sprite.width,
                        sprite.height,
                        0,
                        0,
                        sprite.width,
                        sprite.height
                    );

                    // 返回更新后的精灵
                    return {
                        ...sprite,
                        x: sprite.originalX,
                        y: sprite.originalY,
                        image: tempCanvas.toDataURL(),
                    };
                }
                return sprite;
            });
        });
    };

    // 重置精灵尺寸
    const resetSpriteSize = id => {
        setSprites(prevSprites => {
            return prevSprites.map(sprite => {
                if (sprite.id === id) {
                    // 创建临时画布
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = sprite.originalWidth;
                    tempCanvas.height = sprite.originalHeight;
                    const tempCtx = tempCanvas.getContext("2d");

                    // 从原始图像中提取区域
                    tempCtx.drawImage(
                        originalImage,
                        sprite.x,
                        sprite.y,
                        sprite.originalWidth,
                        sprite.originalHeight,
                        0,
                        0,
                        sprite.originalWidth,
                        sprite.originalHeight
                    );

                    // 返回更新后的精灵
                    return {
                        ...sprite,
                        width: sprite.originalWidth,
                        height: sprite.originalHeight,
                        image: tempCanvas.toDataURL(),
                    };
                }
                return sprite;
            });
        });
    };

    // 生成GIF预览
    const generateGifPreview = () => {
        if (sprites.length === 0 || frameOrder.length === 0) return;

        setIsGenerating(true);

        // 找出所有帧中最大的宽度和高度
        let maxWidth = 0;
        let maxHeight = 0;
        frameOrder.forEach(id => {
            const sprite = sprites.find(s => s.id === id);
            if (sprite) {
                if (sprite.width > maxWidth) maxWidth = sprite.width;
                if (sprite.height > maxHeight) maxHeight = sprite.height;
            }
        });

        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: maxWidth,
            height: maxHeight,
            workerScript: "/gif.worker.js",
        });

        // 创建离屏画布用于绘制调整后的帧
        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = maxWidth;
        frameCanvas.height = maxHeight;
        const frameCtx = frameCanvas.getContext("2d");

        // 按照用户设置的顺序添加帧
        const addFramePromises = frameOrder.map(id => {
            return new Promise(resolve => {
                const sprite = sprites.find(s => s.id === id);
                if (!sprite) {
                    resolve();
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    // 清除画布
                    frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);

                    // 从原始图像中提取自定义区域并绘制到帧画布上
                    frameCtx.drawImage(
                        originalImage,
                        sprite.x,
                        sprite.y,
                        sprite.width,
                        sprite.height,
                        0,
                        0,
                        sprite.width,
                        sprite.height
                    );

                    // 添加帧到GIF
                    gif.addFrame(frameCanvas, { delay: delay, copy: true });
                    resolve();
                };
                img.src = sprite.image;
            });
        });

        Promise.all(addFramePromises).then(() => {
            gif.on("finished", blob => {
                const url = URL.createObjectURL(blob);
                setGifPreview(url);
                setIsGenerating(false);
            });

            gif.render();
        });
    };

    // 保存GIF
    const saveGif = () => {
        if (!gifPreview) return;

        const link = document.createElement("a");
        link.href = gifPreview;
        link.download = "animated.gif";
        link.click();
    };

    // 保存APNG (更新APNG保存逻辑，支持自定义精灵位置和尺寸)
    const saveApng = () => {
        if (!gifPreview) return;

        if (sprites.length === 0 || frameOrder.length === 0) return;

        // 找出所有帧中最大的宽度和高度
        let maxWidth = 0;
        let maxHeight = 0;
        frameOrder.forEach(id => {
            const sprite = sprites.find(s => s.id === id);
            if (sprite) {
                if (sprite.width > maxWidth) maxWidth = sprite.width;
                if (sprite.height > maxHeight) maxHeight = sprite.height;
            }
        });

        // 创建离屏画布
        const canvas = document.createElement("canvas");
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext("2d");

        // 创建所有帧图像的列表，用于合成
        const frames = [];
        const delays = [];

        // 加载所有精灵图像
        const loadPromises = frameOrder.map(id => {
            return new Promise(resolve => {
                const sprite = sprites.find(s => s.id === id);
                if (!sprite) resolve(null);

                // 清除画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 从原始图像中提取自定义区域并绘制
                ctx.drawImage(
                    originalImage,
                    sprite.x,
                    sprite.y,
                    sprite.width,
                    sprite.height,
                    0,
                    0,
                    sprite.width,
                    sprite.height
                );

                // 获取图像数据
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // 将ImageData转为可传输对象
                const transferableImageData = {
                    width: imageData.width,
                    height: imageData.height,
                    data: Array.from(imageData.data),
                };

                frames.push(transferableImageData);
                delays.push(delay);
                resolve();
            });
        });

        // 等待所有图像加载完成
        Promise.all(loadPromises).then(() => {
            try {
                // 创建一个Web Worker来生成APNG以避免阻塞主线程
                const worker = new Worker("/apng-worker.js");

                worker.onmessage = function (e) {
                    if (e.data.type === "done") {
                        const blob = new Blob([e.data.buffer], { type: "image/png" });
                        const url = URL.createObjectURL(blob);

                        // 下载文件
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "animated.png";
                        link.click();

                        // 清理
                        URL.revokeObjectURL(url);
                        worker.terminate();
                    } else if (e.data.type === "error") {
                        console.error("APNG生成错误:", e.data.error);
                        alert("生成APNG失败：" + e.data.error);
                    }
                };

                // 发送数据到Worker
                worker.postMessage({
                    frames: frames,
                    delays: delays,
                });
            } catch (error) {
                console.error("APNG创建失败:", error);

                // 回退方案：直接使用GIF作为PNG保存（与之前相同）
                const link = document.createElement("a");
                link.href = gifPreview;
                link.download = "animated.png";
                link.click();
            }
        });
    };

    // 调整帧顺序
    const moveFrame = (id, direction) => {
        const newOrder = [...frameOrder];
        const index = newOrder.indexOf(id);

        if (index === -1) return;

        if (direction === "up" && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === "down" && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }

        setFrameOrder(newOrder);
    };

    return (
        <div className='app-container'>
            <div className='language-switch'>
                <button
                    className={`lang-button ${language === "zh" ? "active" : ""}`}
                    onClick={toggleLanguage}
                >
                    中文 / English
                </button>
            </div>

            <h1>{t.title}</h1>

            <div className='upload-section'>
                <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageUpload}
                    id='image-upload'
                    className='file-input'
                />
                <label htmlFor='image-upload' className='file-label'>
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        style={{ marginRight: "8px" }}
                    >
                        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                        <polyline points='17 8 12 3 7 8'></polyline>
                        <line x1='12' y1='3' x2='12' y2='15'></line>
                    </svg>
                    {t.chooseImage}
                </label>
            </div>

            {originalImage && (
                <div className='controls-section'>
                    <div className='mode-switch'>
                        <button
                            className={`mode-button ${!customSize ? "active" : ""}`}
                            onClick={toggleSizeMode}
                            disabled={!customSize}
                        >
                            {t.byRowsCols}
                        </button>
                        <button
                            className={`mode-button ${customSize ? "active" : ""}`}
                            onClick={toggleSizeMode}
                            disabled={customSize}
                        >
                            {t.bySize}
                        </button>
                    </div>

                    {!customSize ? (
                        <div className='grid-controls'>
                            <div>
                                <label>{t.cols}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={cols}
                                    onChange={e => handleGridChange(e, "cols")}
                                />
                            </div>
                            <div>
                                <label>{t.rows}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={rows}
                                    onChange={e => handleGridChange(e, "rows")}
                                />
                            </div>
                            <div className='info-box'>
                                <span>
                                    {t.frameSizeInfo} {Math.floor(originalImage.width / cols)} ×{" "}
                                    {Math.floor(originalImage.height / rows)} {t.px}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className='grid-controls'>
                            <div>
                                <label>{t.frameWidth}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={spriteWidth}
                                    onChange={e => handleSpriteSize(e, "width")}
                                />
                                <span>{t.px}</span>
                            </div>
                            <div>
                                <label>{t.frameHeight}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={spriteHeight}
                                    onChange={e => handleSpriteSize(e, "height")}
                                />
                                <span>{t.px}</span>
                            </div>
                            <div className='info-box'>
                                <span>
                                    {t.generateFramesInfo}{" "}
                                    {Math.floor(originalImage.width / spriteWidth)} ×{" "}
                                    {Math.floor(originalImage.height / spriteHeight)} {t.frames}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className='grid-controls delay-control'>
                        <div>
                            <label>{t.frameDelay}</label>
                            <input
                                type='number'
                                min='10'
                                max='1000'
                                value={delay}
                                onChange={e => setDelay(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 隐藏的画布用于图像处理 */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {sprites.length > 0 && (
                <div className='main-content'>
                    <div className='sprites-container'>
                        <h3>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='20'
                                height='20'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                style={{ marginRight: "8px", verticalAlign: "middle" }}
                            >
                                <line x1='4' y1='9' x2='20' y2='9'></line>
                                <line x1='4' y1='15' x2='20' y2='15'></line>
                                <line x1='10' y1='3' x2='8' y2='21'></line>
                                <line x1='16' y1='3' x2='14' y2='21'></line>
                            </svg>
                            {t.sortFrames}
                        </h3>
                        <div className='frames-list'>
                            {frameOrder.map((id, index) => {
                                const sprite = sprites.find(s => s.id === id);
                                if (!sprite) return null;

                                return (
                                    <div
                                        key={id}
                                        className={`frame-item ${
                                            selectedFrameId === id ? "selected" : ""
                                        }`}
                                        onClick={() => setSelectedFrameId(id)}
                                    >
                                        <img
                                            src={sprite.image}
                                            alt={`动画帧 ${index + 1} - 坐标 (${sprite.x}, ${
                                                sprite.y
                                            })`}
                                        />
                                        <div className='frame-controls'>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    moveFrame(id, "up");
                                                }}
                                                disabled={index === 0}
                                                title='上移'
                                            >
                                                ↑
                                            </button>
                                            <span>{index + 1}</span>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    moveFrame(id, "down");
                                                }}
                                                disabled={index === frameOrder.length - 1}
                                                title='下移'
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {selectedFrameId !== null && (
                            <div className='frame-customize-panel'>
                                <h3>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ marginRight: "8px", verticalAlign: "middle" }}
                                    >
                                        <rect
                                            x='3'
                                            y='3'
                                            width='18'
                                            height='18'
                                            rx='2'
                                            ry='2'
                                        ></rect>
                                        <line x1='9' y1='3' x2='9' y2='21'></line>
                                        <line x1='15' y1='3' x2='15' y2='21'></line>
                                        <line x1='3' y1='9' x2='21' y2='9'></line>
                                        <line x1='3' y1='15' x2='21' y2='15'></line>
                                    </svg>
                                    {t.customizeFrames}
                                </h3>
                                {(() => {
                                    const sprite = sprites.find(s => s.id === selectedFrameId);
                                    if (!sprite) return null;

                                    return (
                                        <div className='customize-controls'>
                                            <div className='position-controls'>
                                                <div>
                                                    <label>{t.posX}</label>
                                                    <input
                                                        type='number'
                                                        value={sprite.x}
                                                        onChange={e =>
                                                            updateSpriteProperty(
                                                                selectedFrameId,
                                                                "x",
                                                                e.target.value
                                                            )
                                                        }
                                                        min='0'
                                                        max={originalImage.width - sprite.width}
                                                    />
                                                    <span>{t.px}</span>
                                                </div>
                                                <div>
                                                    <label>{t.posY}</label>
                                                    <input
                                                        type='number'
                                                        value={sprite.y}
                                                        onChange={e =>
                                                            updateSpriteProperty(
                                                                selectedFrameId,
                                                                "y",
                                                                e.target.value
                                                            )
                                                        }
                                                        min='0'
                                                        max={originalImage.height - sprite.height}
                                                    />
                                                    <span>{t.px}</span>
                                                </div>
                                                <button
                                                    className='reset-button'
                                                    onClick={() =>
                                                        resetSpritePosition(selectedFrameId)
                                                    }
                                                >
                                                    {t.resetPos}
                                                </button>
                                            </div>
                                            <div className='size-controls'>
                                                <div>
                                                    <label>{t.width}</label>
                                                    <input
                                                        type='number'
                                                        value={sprite.width}
                                                        onChange={e =>
                                                            updateSpriteProperty(
                                                                selectedFrameId,
                                                                "width",
                                                                e.target.value
                                                            )
                                                        }
                                                        min='10'
                                                        max={originalImage.width - sprite.x}
                                                    />
                                                    <span>{t.px}</span>
                                                </div>
                                                <div>
                                                    <label>{t.height}</label>
                                                    <input
                                                        type='number'
                                                        value={sprite.height}
                                                        onChange={e =>
                                                            updateSpriteProperty(
                                                                selectedFrameId,
                                                                "height",
                                                                e.target.value
                                                            )
                                                        }
                                                        min='10'
                                                        max={originalImage.height - sprite.y}
                                                    />
                                                    <span>{t.px}</span>
                                                </div>
                                                <button
                                                    className='reset-button'
                                                    onClick={() => resetSpriteSize(selectedFrameId)}
                                                >
                                                    {t.resetSize}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    <div className='preview-section'>
                        <button
                            onClick={generateGifPreview}
                            className='preview-button'
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{
                                            marginRight: "8px",
                                            animation: "spin 2s linear infinite",
                                        }}
                                    >
                                        <circle cx='12' cy='12' r='10'></circle>
                                        <path d='M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'></path>
                                    </svg>
                                    {t.generating}
                                </>
                            ) : (
                                <>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ marginRight: "8px" }}
                                    >
                                        <path d='M12 3v12l8-8-8-8z'></path>
                                        <path d='M3 8h6v13H3z'></path>
                                    </svg>
                                    {t.generatePreview}
                                </>
                            )}
                        </button>

                        {gifPreview && (
                            <div className='gif-preview'>
                                <h3>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ marginRight: "8px", verticalAlign: "middle" }}
                                    >
                                        <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'></polygon>
                                    </svg>
                                    {t.gifPreview}
                                </h3>
                                <img src={gifPreview} alt='动画GIF预览效果' />
                                <div className='save-buttons'>
                                    <button onClick={saveGif} className='save-button'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            width='20'
                                            height='20'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            style={{ marginRight: "8px" }}
                                        >
                                            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                                            <polyline points='7 10 12 15 17 10'></polyline>
                                            <line x1='12' y1='15' x2='12' y2='3'></line>
                                        </svg>
                                        {t.saveGif}
                                    </button>
                                    <button onClick={saveApng} className='save-button save-apng'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            width='20'
                                            height='20'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            style={{ marginRight: "8px" }}
                                        >
                                            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                                            <polyline points='7 10 12 15 17 10'></polyline>
                                            <line x1='12' y1='15' x2='12' y2='3'></line>
                                        </svg>
                                        {t.saveApng}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 添加GitHub链接 */}
            <footer className='github-footer'>
                <a
                    href='https://github.com/zqq-nuli/4oImg-to-gif'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='github-link'
                >
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'></path>
                    </svg>
                    <span>GitHub</span>
                </a>
            </footer>
        </div>
    );
}

export default App;
