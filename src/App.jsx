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
        generating: "生成中...",
        generatePreview: "生成GIF预览",
        gifPreview: "GIF 预览",
        saveGif: "保存 GIF",
        px: "px"
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
        generating: "Generating...",
        generatePreview: "Generate GIF Preview",
        gifPreview: "GIF Preview",
        saveGif: "Save GIF",
        px: "px"
    }
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
    const [language, setLanguage] = useState("en"); // 默认语言为中文
    const canvasRef = useRef(null);

    // 获取当前语言的翻译
    const t = translations[language];

    // 切换语言
    const toggleLanguage = () => {
        setLanguage(prev => prev === "zh" ? "en" : "zh");
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
                    x,
                    y,
                });
            }
        }

        setSprites(newSprites);

        // 初始化帧顺序为正常顺序
        const initialOrder = newSprites.map(sprite => sprite.id);
        setFrameOrder(initialOrder);
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

    // 生成GIF预览
    const generateGifPreview = () => {
        if (sprites.length === 0 || frameOrder.length === 0) return;

        setIsGenerating(true);

        const finalWidth = customSize ? spriteWidth : Math.floor(originalImage.width / cols);
        const finalHeight = customSize ? spriteHeight : Math.floor(originalImage.height / rows);

        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: finalWidth,
            height: finalHeight,
            workerScript: "/gif.worker.js",
        });

        // 按照用户设置的顺序添加帧
        for (const id of frameOrder) {
            const sprite = sprites.find(s => s.id === id);
            if (!sprite) continue;

            const img = new Image();
            img.src = sprite.image;

            // 添加每一帧
            gif.addFrame(img, { delay: delay });
        }

        gif.on("finished", blob => {
            const url = URL.createObjectURL(blob);
            setGifPreview(url);
            setIsGenerating(false);
        });

        gif.render();
    };

    // 保存GIF
    const saveGif = () => {
        if (!gifPreview) return;

        const link = document.createElement("a");
        link.href = gifPreview;
        link.download = "animated.gif";
        link.click();
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
            <div className="language-switch">
                <button className={`lang-button ${language === 'zh' ? 'active' : ''}`} onClick={toggleLanguage}>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    {t.chooseImage}
                </label>
            </div>

            {originalImage && (
                <div className='controls-section'>
                    <div className="mode-switch">
                        <button 
                            className={`mode-button ${!customSize ? 'active' : ''}`} 
                            onClick={toggleSizeMode}
                            disabled={!customSize}
                        >
                            {t.byRowsCols}
                        </button>
                        <button 
                            className={`mode-button ${customSize ? 'active' : ''}`}
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
                            <div className="info-box">
                                <span>{t.frameSizeInfo} {Math.floor(originalImage.width / cols)} × {Math.floor(originalImage.height / rows)} {t.px}</span>
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
                            <div className="info-box">
                                <span>{t.generateFramesInfo} {Math.floor(originalImage.width / spriteWidth)} × {Math.floor(originalImage.height / spriteHeight)} {t.frames}</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                                <line x1="4" y1="9" x2="20" y2="9"></line>
                                <line x1="4" y1="15" x2="20" y2="15"></line>
                                <line x1="10" y1="3" x2="8" y2="21"></line>
                                <line x1="16" y1="3" x2="14" y2="21"></line>
                            </svg>
                            {t.sortFrames}
                        </h3>
                        <div className='frames-list'>
                            {frameOrder.map((id, index) => {
                                const sprite = sprites.find(s => s.id === id);
                                if (!sprite) return null;

                                return (
                                    <div key={id} className='frame-item'>
                                        <img src={sprite.image} alt={`Frame ${index}`} />
                                        <div className='frame-controls'>
                                            <button
                                                onClick={() => moveFrame(id, "up")}
                                                disabled={index === 0}
                                                title="上移"
                                            >
                                                ↑
                                            </button>
                                            <span>{index + 1}</span>
                                            <button
                                                onClick={() => moveFrame(id, "down")}
                                                disabled={index === frameOrder.length - 1}
                                                title="下移"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className='preview-section'>
                        <button
                            onClick={generateGifPreview}
                            className='preview-button'
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', animation: 'spin 2s linear infinite'}}>
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                                    </svg>
                                    {t.generating}
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                                        <path d="M12 3v12l8-8-8-8z"></path>
                                        <path d="M3 8h6v13H3z"></path>
                                    </svg>
                                    {t.generatePreview}
                                </>
                            )}
                        </button>

                        {gifPreview && (
                            <div className='gif-preview'>
                                <h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                    </svg>
                                    {t.gifPreview}
                                </h3>
                                <img src={gifPreview} alt='GIF Preview' />
                                <button onClick={saveGif} className='save-button'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    {t.saveGif}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
